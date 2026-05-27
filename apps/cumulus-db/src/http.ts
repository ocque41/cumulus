// SPDX-License-Identifier: AGPL-3.0-only
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CumulusDbConfig } from './config.js';
import { parseEnvFile } from './env-parser.js';
import {
  appendDatabaseAuditEvent,
  compileDatabaseManifest,
  createDatabaseApplyFailure,
  createDatabaseApproval,
  createDatabasePlan,
  createDatabaseSnapshot,
  executeDatabasePlan,
  normalizeDatabaseState,
  restoreDatabaseSnapshot as restoreLogicalDatabaseSnapshot,
  verifyDatabaseAuditChain,
  type CumulusDatabasePlan,
  type CumulusDatabaseState,
  type DatabaseApplyResult,
  type DatabaseAuditEvent,
  type DatabaseApprovalRecord,
  type DatabaseRestoreResult,
  type DatabaseSnapshot,
  type DatabaseTarget,
  type NimbusDatabaseIr,
  type NimbusDatabaseManifest,
} from './database-transaction.js';
import type { NimbusIr } from './nimbus.js';
import { LocalOAuthProvider, type OAuthHttpResult } from './oauth.js';
import { LocalPasskeyStepUpStore } from './passkeys.js';
import { InMemoryRateLimiter, type RateLimitPolicy, type RateLimitResult } from './rate-limit.js';
import type { CumulusDbEngine } from './storage.js';
import {
  SYSTEM_SCOPE_REGISTRY,
  claimSystemOrg,
  disableSystemAgent,
  ensureDatabaseTransactionState,
  isHardSystemScope,
  updateSystemPrincipalGrants,
  type PrincipalType,
  type SystemSnapshotRecord,
  type SystemState,
} from './system.js';
import type { RecordType, TokenRecord, TokenScope } from './types.js';

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(body));
}

function sendNoContent(res: ServerResponse): void {
  res.writeHead(204, { 'Cache-Control': 'no-store' });
  res.end();
}

function sendOAuth(res: ServerResponse, result: OAuthHttpResult): void {
  send(res, result.status, result.body);
}

function sendRateLimited(res: ServerResponse, result: RateLimitResult): void {
  res.writeHead(429, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Retry-After': String(result.retryAfterSeconds),
  });
  res.end(
    JSON.stringify({
      error: 'rate_limited',
      retryAfterSeconds: result.retryAfterSeconds,
      resetAt: result.resetAt,
    }),
  );
}

function publicTokenRecord(token: TokenRecord): Omit<TokenRecord, 'tokenHash' | 'secretMac'> {
  return {
    id: token.id,
    label: token.label,
    ...(token.tokenPublicId ? { tokenPublicId: token.tokenPublicId } : {}),
    ...(token.tokenKind ? { tokenKind: token.tokenKind } : {}),
    ...(token.principalType ? { principalType: token.principalType } : {}),
    ...(token.principalId ? { principalId: token.principalId } : {}),
    scopes: token.scopes,
    createdAt: token.createdAt,
    lastUsedAt: token.lastUsedAt,
    revokedAt: token.revokedAt,
    expiresAt: token.expiresAt,
    rotatedFromId: token.rotatedFromId,
  };
}

function publicSnapshot(snapshot: SystemSnapshotRecord): Omit<SystemSnapshotRecord, 'path'> & { storage: 'provider-managed' } {
  return {
    id: snapshot.id,
    kind: snapshot.kind,
    createdAt: snapshot.createdAt,
    createdByType: snapshot.createdByType,
    createdById: snapshot.createdById,
    metadata: snapshot.metadata,
    storage: 'provider-managed',
  };
}

function publicSystemState(state: SystemState) {
  return {
    ...state,
    approvals: state.approvals.map((approval) => ({
      id: approval.id,
      planId: approval.planId,
      planHash: approval.planHash,
      scope: approval.scope,
      createdAt: approval.createdAt,
      expiresAt: approval.expiresAt,
      usedAt: approval.usedAt,
      actorType: approval.actorType,
      actorId: approval.actorId,
      targetVersionId: approval.targetVersionId,
      targetSnapshotId: approval.targetSnapshotId,
    })),
    schema: {
      ...state.schema,
      snapshots: state.schema.snapshots.map(publicSnapshot),
    },
  };
}

function publicApplyResult<T extends { snapshot: SystemSnapshotRecord | null }>(result: T): Omit<T, 'snapshot'> & {
  snapshot: ReturnType<typeof publicSnapshot> | null;
} {
  return {
    ...result,
    snapshot: result.snapshot ? publicSnapshot(result.snapshot) : null,
  };
}

interface McpToolContract {
  name: string;
  description: string;
  mode: 'read' | 'write' | 'dry-run' | 'destructive';
  required: string[];
  dryRunFirst?: boolean;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
  };
  inputSchema: {
    type: 'object';
    required: string[];
    properties: Record<string, unknown>;
    additionalProperties: boolean;
  };
}

function mcpTool(
  name: string,
  description: string,
  mode: McpToolContract['mode'],
  required: string[],
  properties: Record<string, unknown>,
  options: Pick<McpToolContract, 'dryRunFirst'> = {},
): McpToolContract {
  return {
    name,
    description,
    mode,
    required,
    ...options,
    annotations: {
      readOnlyHint: mode === 'read',
      destructiveHint: mode === 'destructive',
      idempotentHint: mode === 'read',
    },
    inputSchema: {
      type: 'object',
      required,
      properties,
      additionalProperties: false,
    },
  };
}

const mcpBaseProperties = {
  database_id: { type: 'string' },
  token: { type: 'string' },
} as const;

const MCP_TOOL_SCHEMAS = [
  mcpTool('cumulus_db_create_record', 'Create a workspace record.', 'write', ['database_id', 'token', 'type'], {
    ...mcpBaseProperties,
    type: { type: 'string' },
    title: { type: 'string' },
    content: { type: 'string' },
    json: {},
    tags: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object' },
  }),
  mcpTool('cumulus_db_search', 'Search records by text, vector, type, and limit.', 'read', ['database_id', 'token'], {
    ...mcpBaseProperties,
    query: { type: 'string' },
    vector: { type: 'array', items: { type: 'number' } },
    type: { type: 'string' },
    limit: { type: 'number' },
  }),
  mcpTool('cumulus_db_append_event', 'Append an event record.', 'write', ['database_id', 'token'], {
    ...mcpBaseProperties,
    title: { type: 'string' },
    content: { type: 'string' },
    json: {},
    tags: { type: 'array', items: { type: 'string' } },
    metadata: { type: 'object' },
  }),
  mcpTool('cumulus_db_put_kv', 'Write a key-value entry.', 'write', ['database_id', 'token', 'key', 'value'], {
    ...mcpBaseProperties,
    key: { type: 'string' },
    value: {},
    metadata: { type: 'object' },
  }),
  mcpTool('cumulus_db_get_kv', 'Read a key-value entry.', 'read', ['database_id', 'token', 'key'], {
    ...mcpBaseProperties,
    key: { type: 'string' },
  }),
  mcpTool('cumulus_db_parse_env', 'Parse dotenv content without persisting it.', 'read', ['content'], {
    content: { type: 'string' },
  }),
  mcpTool('cumulus_db_reveal_secret', 'Reveal an encrypted secret with the required scope.', 'destructive', ['database_id', 'token', 'record_id'], {
    ...mcpBaseProperties,
    record_id: { type: 'string' },
    field: { type: 'string' },
  }),
  mcpTool('cumulus.plan_schema', 'Compile and plan Nimbus schema changes without applying them.', 'dry-run', ['database_id', 'token'], {
    ...mcpBaseProperties,
    source: { type: 'string' },
    desired: { type: 'object' },
  }),
  mcpTool('cumulus.compile_manifest', 'Compile a Nimbus DB manifest into normalized database IR.', 'read', ['database_id', 'token', 'manifest'], {
    ...mcpBaseProperties,
    manifest: { type: 'object' },
  }),
  mcpTool('cumulus.create_plan', 'Create an immutable Cumulus database plan from DB IR and current or inspected live state.', 'dry-run', ['database_id', 'token'], {
    ...mcpBaseProperties,
    manifest: { type: 'object' },
    ir: { type: 'object' },
    current_state: { type: 'object' },
  }),
  mcpTool('cumulus.get_plan', 'Read a saved Cumulus database plan and its transaction status.', 'read', ['database_id', 'token', 'plan_id'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
  }),
  mcpTool('cumulus.classify_risk', 'Read the risk summary for a saved database plan.', 'read', ['database_id', 'token', 'plan_id'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
  }),
  mcpTool('cumulus.request_database_approval', 'Create a plan-hash-bound approval record for a saved database plan.', 'write', ['database_id', 'token', 'plan_id', 'reason'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
    reason: { type: 'string' },
  }),
  mcpTool('cumulus.apply_plan', 'Apply a saved database plan against the current fingerprinted or inspected live state.', 'destructive', ['database_id', 'token', 'plan_id'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
    current_state: { type: 'object' },
    approval_id: { type: 'string' },
  }, { dryRunFirst: true }),
  mcpTool('cumulus.restore_snapshot', 'Restore a logical database snapshot into state output.', 'destructive', ['database_id', 'token'], {
    ...mcpBaseProperties,
    snapshot: { type: 'object' },
    snapshot_id: { type: 'string' },
  }, { dryRunFirst: true }),
  mcpTool('cumulus.revert', 'Restore a saved or supplied logical database snapshot.', 'destructive', ['database_id', 'token'], {
    ...mcpBaseProperties,
    snapshot: { type: 'object' },
    snapshot_id: { type: 'string' },
  }, { dryRunFirst: true }),
  mcpTool('cumulus.verify_audit_chain', 'Verify a hash-chained database audit event list.', 'read', ['database_id', 'token', 'audit'], {
    ...mcpBaseProperties,
    audit: { type: 'array', items: { type: 'object' } },
  }),
  mcpTool('cumulus.get_audit_events', 'Read persisted Cumulus database transaction audit events.', 'read', ['database_id', 'token'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
    event_type: { type: 'string' },
    limit: { type: 'number' },
  }),
  mcpTool('cumulus.read_system_state', 'Read public-safe system state.', 'read', ['database_id', 'token'], mcpBaseProperties),
  mcpTool('cumulus.request_approval', 'Request a short-lived approval token.', 'write', ['database_id', 'token'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
    reason: { type: 'string' },
    kind: { type: 'string' },
    version_id: { type: 'string' },
    snapshot_id: { type: 'string' },
  }),
  mcpTool('cumulus.apply_schema', 'Apply a previously planned schema change.', 'destructive', ['database_id', 'token', 'plan_id'], {
    ...mcpBaseProperties,
    plan_id: { type: 'string' },
    approval_token: { type: 'string' },
  }, { dryRunFirst: true }),
  mcpTool('cumulus.create_snapshot', 'Create a provider-managed or database logical snapshot.', 'write', ['database_id', 'token'], {
    ...mcpBaseProperties,
    target: { type: 'object' },
    current_state: { type: 'object' },
    schemas: { type: 'array', items: { type: 'string' } },
    reason: { type: 'string' },
    plan_id: { type: 'string' },
  }),
  mcpTool('cumulus.revert_version', 'Revert schema state to a version or snapshot.', 'destructive', ['database_id', 'token', 'approval_token'], {
    ...mcpBaseProperties,
    version_id: { type: 'string' },
    snapshot_id: { type: 'string' },
    approval_token: { type: 'string' },
  }, { dryRunFirst: true }),
  mcpTool('cumulus.rotate_self_token', 'Rotate the current bearer token.', 'write', ['database_id', 'token'], mcpBaseProperties),
] as const satisfies readonly McpToolContract[];

const MCP_TOOL_NAMES = MCP_TOOL_SCHEMAS.map((tool) => tool.name);

function validateMcpArguments(toolName: string, args: Record<string, unknown>): void {
  const schema = MCP_TOOL_SCHEMAS.find((tool) => tool.name === toolName);
  if (!schema) return;
  const missing = schema.required.filter((key) => args[key] === undefined || args[key] === null || args[key] === '');
  if (missing.length) {
    throw new Error(`missing required MCP argument(s): ${missing.join(', ')}`);
  }
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await readBody(req);
  if (!raw.trim()) return {};
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('expected JSON object');
  }
  return parsed as Record<string, unknown>;
}

async function readBodyObject(req: IncomingMessage): Promise<Record<string, unknown>> {
  const raw = await readBody(req);
  if (!raw.trim()) return {};
  const contentType = Array.isArray(req.headers['content-type']) ? req.headers['content-type'][0] : req.headers['content-type'];
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('expected request object');
  }
  return parsed as Record<string, unknown>;
}

function bearer(req: IncomingMessage): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function isAdmin(req: IncomingMessage, config: CumulusDbConfig): boolean {
  const header = req.headers['x-cumulus-admin-key'];
  const value = Array.isArray(header) ? header[0] : header;
  return Boolean(config.adminSecret && value && value === config.adminSecret);
}

function requestIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return forwardedValue?.split(',')[0]?.trim() || req.socket.remoteAddress || 'local';
}

function checkRateLimit(
  limiter: InMemoryRateLimiter,
  res: ServerResponse,
  key: string,
  policy: RateLimitPolicy,
): boolean {
  const result = limiter.consume(key, policy);
  if (result.allowed) return true;
  sendRateLimited(res, result);
  return false;
}

function principalKey(token: TokenRecord | null): string {
  return token?.principalId ?? token?.id ?? 'admin';
}

function principalType(token: TokenRecord | null): PrincipalType {
  return token?.principalType ?? 'system';
}

function approvalActorType(token: TokenRecord | null): 'human' | 'agent' | 'system' {
  const type = principalType(token);
  return type === 'human' || type === 'agent' ? type : 'system';
}

function verifyRelaySignature(rawBody: string, req: IncomingMessage, secret: string | null): boolean {
  if (!secret) return process.env.NODE_ENV !== 'production';
  const signature = req.headers['x-relay-signature'];
  const value = Array.isArray(signature) ? signature[0] : signature;
  if (!value?.startsWith('sha256=')) return false;
  const actual = createHmac('sha256', secret).update(rawBody).digest('hex');
  const expected = value.slice('sha256='.length);
  if (actual.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

async function requireDbToken(
  engine: CumulusDbEngine,
  req: IncomingMessage,
  dbId: string,
  scopes: TokenScope[],
): Promise<TokenRecord> {
  const token = bearer(req);
  if (!token) throw new Error('unauthorized');
  return engine.authenticate(dbId, token, scopes);
}

async function requireAccess(
  engine: CumulusDbEngine,
  config: CumulusDbConfig,
  req: IncomingMessage,
  dbId: string,
  scopes: TokenScope[],
): Promise<TokenRecord | null> {
  if (isAdmin(req, config)) return null;
  return requireDbToken(engine, req, dbId, scopes);
}

interface MutableSystemEngine {
  writeSystemState(dbId: string, state: SystemState): Promise<void>;
  writeAudit(
    dbId: string,
    event: {
      action: string;
      actor: { type: string; id: string };
      target: { type: string; id: string };
      metadata?: Record<string, unknown>;
    },
  ): Promise<void>;
}

async function writeSystemState(engine: CumulusDbEngine, dbId: string, state: SystemState): Promise<void> {
  await (engine as unknown as MutableSystemEngine).writeSystemState(dbId, state);
}

async function writeSystemAudit(
  engine: CumulusDbEngine,
  dbId: string,
  event: Parameters<MutableSystemEngine['writeAudit']>[1],
): Promise<void> {
  await (engine as unknown as MutableSystemEngine).writeAudit(dbId, event);
}

function assertCanGrantHardScopes(caller: TokenRecord | null, requestedScopes: TokenScope[]): void {
  if (!caller) return;
  const missing = requestedScopes.filter((scope) => isHardSystemScope(scope) && !caller.scopes.includes(scope));
  if (missing.length) throw new Error('unauthorized');
}

function segments(pathname: string): string[] {
  return pathname.split('/').filter(Boolean);
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function numberArray(value: unknown): number[] | undefined {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw new Error('vector must be an array');
  return value.map(Number);
}

function recordInput(body: Record<string, unknown>) {
  return {
    type: stringValue(body.type, 'note') as RecordType,
    key: typeof body.key === 'string' ? body.key : undefined,
    title: typeof body.title === 'string' ? body.title : undefined,
    content: typeof body.content === 'string' || body.content === null ? body.content : undefined,
    json: body.json,
    tags: stringArray(body.tags),
    vector: numberArray(body.vector),
    metadata:
      body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
        ? (body.metadata as Record<string, unknown>)
        : {},
    secrets:
      body.secrets && typeof body.secrets === 'object' && !Array.isArray(body.secrets)
        ? Object.fromEntries(
            Object.entries(body.secrets as Record<string, unknown>).map(([key, value]) => [
              key,
              String(value ?? ''),
            ]),
          )
        : undefined,
    recordIsSecret: body.recordIsSecret === true,
  };
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${name} is required`);
  return value;
}

function objectValue<T extends object>(value: unknown, name: string): T {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value as T;
}

function databaseIrFromBody(body: Record<string, unknown>): NimbusDatabaseIr {
  if (body.ir) return objectValue<NimbusDatabaseIr>(body.ir, 'ir');
  return compileDatabaseManifest(objectValue<NimbusDatabaseManifest>(body.manifest, 'manifest'));
}

interface DatabaseStateInspector {
  inspectDatabaseState(target: DatabaseTarget, options?: { schemas?: string[] }): Promise<CumulusDatabaseState>;
}

interface DatabasePlanApplyInput {
  plan: CumulusDatabasePlan;
  currentState: CumulusDatabaseState;
  approval?: DatabaseApprovalRecord;
  actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
}

interface DatabasePlanApplier {
  applyDatabasePlan(input: DatabasePlanApplyInput): Promise<DatabaseApplyResult>;
}

interface DatabaseSnapshotRestorer {
  restoreDatabaseSnapshot(input: {
    snapshot: DatabaseSnapshot;
    actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
  }): Promise<DatabaseRestoreResult>;
}

function canInspectDatabaseState(engine: CumulusDbEngine): engine is CumulusDbEngine & DatabaseStateInspector {
  return typeof (engine as unknown as Partial<DatabaseStateInspector>).inspectDatabaseState === 'function';
}

function canApplyDatabasePlan(engine: CumulusDbEngine): engine is CumulusDbEngine & DatabasePlanApplier {
  return typeof (engine as unknown as Partial<DatabasePlanApplier>).applyDatabasePlan === 'function';
}

function canRestoreDatabaseSnapshot(engine: CumulusDbEngine): engine is CumulusDbEngine & DatabaseSnapshotRestorer {
  return typeof (engine as unknown as Partial<DatabaseSnapshotRestorer>).restoreDatabaseSnapshot === 'function';
}

function uniqueSchemas(values: string[]): string[] {
  const schemas = [...new Set(values.filter(Boolean))].sort();
  return schemas.length ? schemas : ['public'];
}

function databaseIrSchemas(ir: NimbusDatabaseIr): string[] {
  return uniqueSchemas([
    ...ir.resources.schemas.map((schema) => schema.name),
    ...ir.resources.tables.map((table) => table.schema),
  ]);
}

function planRecordSchemas(planRecord: { currentState: CumulusDatabaseState; plan: { steps: Array<{ op: string; object: string }> } }): string[] {
  const schemas = planRecord.currentState.schemas.map((schema) => schema.name);
  for (const step of planRecord.plan.steps) {
    if (step.op === 'create_schema') {
      schemas.push(step.object);
      continue;
    }
    const schema = step.object.split('.')[0];
    if (schema && schema !== 'raw_sql') schemas.push(schema);
  }
  return uniqueSchemas(schemas);
}

async function resolveDatabaseCurrentState(
  engine: CumulusDbEngine,
  input: unknown,
  target: DatabaseTarget,
  schemas: string[],
  name: string,
): Promise<CumulusDatabaseState> {
  if (input !== undefined && input !== null) {
    return normalizeDatabaseState(objectValue<CumulusDatabaseState>(input, name));
  }
  if (!canInspectDatabaseState(engine)) {
    throw new Error(`${name} is required unless the engine supports live database inspection`);
  }
  return normalizeDatabaseState(await engine.inspectDatabaseState(target, { schemas }));
}

async function applyDatabasePlan(engine: CumulusDbEngine, input: DatabasePlanApplyInput): Promise<DatabaseApplyResult> {
  if (canApplyDatabasePlan(engine)) return engine.applyDatabasePlan(input);
  return executeDatabasePlan(input);
}

async function recordDatabaseApplyFailure(
  engine: CumulusDbEngine,
  dbId: string,
  state: SystemState,
  input: {
    planRecord: ReturnType<typeof ensureDatabaseTransactionState>['plans'][number];
    currentState: CumulusDatabaseState;
    error: unknown;
    actor: { principalId: string; kind: 'human' | 'agent' | 'system' };
  },
): Promise<DatabaseApplyResult> {
  const databaseTransactions = ensureDatabaseTransactionState(state);
  const failure = createDatabaseApplyFailure({
    plan: input.planRecord.plan,
    currentState: input.currentState,
    error: input.error,
    actor: input.actor,
  });
  input.planRecord.applyRunId = failure.applyRun.applyRunId;
  databaseTransactions.currentState = failure.state;
  databaseTransactions.currentStateFingerprint = failure.state.fingerprint;
  databaseTransactions.applyRuns.push(failure.applyRun);
  appendDatabaseTransactionAuditEvents(databaseTransactions, failure.audit);
  await persistDatabaseTransactionState(engine, dbId, state);
  await writeSystemAudit(engine, dbId, {
    action: 'database.plan_apply_failed',
    actor: { type: input.actor.kind, id: input.actor.principalId },
    target: { type: 'database_plan', id: input.planRecord.plan.planId },
    metadata: {
      planHash: input.planRecord.plan.planHash,
      applyRunId: failure.applyRun.applyRunId,
      errorCode: failure.applyRun.error?.code,
      errorMessage: failure.applyRun.error?.message,
    },
  });
  return failure;
}

async function restoreDatabaseSnapshotForRequest(
  engine: CumulusDbEngine,
  input: {
    snapshot: DatabaseSnapshot;
    actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
  },
): Promise<{ state: CumulusDatabaseState; restore: DatabaseRestoreResult | null }> {
  if (!canRestoreDatabaseSnapshot(engine)) {
    return { state: restoreLogicalDatabaseSnapshot(input.snapshot), restore: null };
  }
  const restore = await engine.restoreDatabaseSnapshot(input);
  return { state: restore.apply.state, restore };
}

function persistDatabaseRestoreResult(databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>, restore: DatabaseRestoreResult): void {
  const appliedAt = restore.apply.applyRun.completedAt;
  if (!databaseTransactions.snapshots.some((snapshot) => snapshot.snapshotId === restore.snapshot.snapshotId)) {
    databaseTransactions.snapshots.push(restore.snapshot);
  }
  databaseTransactions.plans.push({
    plan: restore.plan,
    currentState: restore.currentState,
    status: 'applied',
    createdAt: restore.apply.applyRun.startedAt,
    appliedAt,
    snapshotId: restore.apply.snapshot?.snapshotId ?? null,
    applyRunId: restore.apply.applyRun.applyRunId,
  });
  databaseTransactions.approvals.push({
    ...restore.approval,
    usedAt: appliedAt,
  });
  databaseTransactions.currentState = restore.apply.state;
  databaseTransactions.currentStateFingerprint = restore.apply.state.fingerprint;
  databaseTransactions.applyRuns.push(restore.apply.applyRun);
  if (restore.apply.snapshot) databaseTransactions.snapshots.push(restore.apply.snapshot);
  appendDatabaseTransactionAuditEvents(databaseTransactions, restore.apply.audit);
}

function appendDatabaseTransactionAuditEvent(
  databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>,
  input: Omit<DatabaseAuditEvent, 'auditId' | 'sequence' | 'prevHash' | 'eventHash'>,
): void {
  appendDatabaseAuditEvent(databaseTransactions.audit, input);
}

function appendDatabaseTransactionAuditEvents(
  databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>,
  events: DatabaseAuditEvent[],
): void {
  for (const event of events) {
    appendDatabaseTransactionAuditEvent(databaseTransactions, {
      eventType: event.eventType,
      actor: event.actor,
      target: event.target,
      subject: event.subject,
      ...(event.decision ? { decision: event.decision } : {}),
      timestamp: event.timestamp,
    });
  }
}

function databaseAuditActorFromToken(token: TokenRecord | null): DatabaseAuditEvent['actor'] {
  return { principalId: principalKey(token), kind: approvalActorType(token) };
}

function databaseAuditActorFromApproval(actor: { principalId: string; type: 'human' | 'agent' | 'system' }): DatabaseAuditEvent['actor'] {
  return { principalId: actor.principalId, kind: actor.type };
}

function appendDatabaseManifestAuditEvents(
  databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>,
  input: {
    manifest: NimbusDatabaseManifest;
    ir: NimbusDatabaseIr;
    actor: DatabaseAuditEvent['actor'];
  },
): void {
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'manifest.submitted',
    actor: input.actor,
    target: input.ir.target,
    subject: { metadata: input.manifest.metadata ?? null },
    timestamp: new Date().toISOString(),
  });
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'manifest.compiled',
    actor: input.actor,
    target: input.ir.target,
    subject: { manifestHash: input.ir.manifestHash, irHash: input.ir.hash, metadata: input.ir.metadata ?? null },
    timestamp: new Date().toISOString(),
  });
}

function appendDatabasePlanAuditEvents(
  databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>,
  input: {
    plan: CumulusDatabasePlan;
    currentState: CumulusDatabaseState;
    actor?: DatabaseAuditEvent['actor'];
  },
): void {
  const actor = input.actor ?? { principalId: 'database-planner', kind: 'system' };
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'state.inspected',
    actor,
    target: input.plan.target,
    subject: {
      stateFingerprint: input.currentState.fingerprint,
      schemas: input.currentState.schemas.map((schema) => schema.name),
    },
    timestamp: new Date().toISOString(),
  });
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'plan.created',
    actor,
    target: input.plan.target,
    subject: {
      planId: input.plan.planId,
      planHash: input.plan.planHash,
      manifestHash: input.plan.manifestHash,
      irHash: input.plan.irHash,
    },
    timestamp: new Date().toISOString(),
  });
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'risk.classified',
    actor,
    target: input.plan.target,
    subject: { planId: input.plan.planId, planHash: input.plan.planHash },
    decision: {
      creates: input.plan.summary.creates,
      updates: input.plan.summary.updates,
      drops: input.plan.summary.drops,
      destructive: input.plan.summary.destructive,
      highestRisk: input.plan.summary.highestRisk,
      approvalRequired: input.plan.summary.approvalRequired,
      snapshotRequired: input.plan.summary.snapshotRequired,
    },
    timestamp: new Date().toISOString(),
  });
}

function appendDatabaseApprovalAuditEvents(
  databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>,
  input: {
    plan: CumulusDatabasePlan;
    approval: DatabaseApprovalRecord;
    actor: DatabaseAuditEvent['actor'];
    reason: string;
  },
): void {
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'approval.requested',
    actor: input.actor,
    target: input.plan.target,
    subject: { planId: input.plan.planId, planHash: input.plan.planHash, reason: input.reason },
    decision: { requiredScopes: input.approval.requiredScopes },
    timestamp: input.approval.createdAt,
  });
  appendDatabaseTransactionAuditEvent(databaseTransactions, {
    eventType: 'plan.approved',
    actor: input.actor,
    target: input.plan.target,
    subject: {
      planId: input.plan.planId,
      planHash: input.plan.planHash,
      approvalId: input.approval.approvalId,
    },
    decision: { expiresAt: input.approval.expiresAt, requiredScopes: input.approval.requiredScopes },
    timestamp: input.approval.createdAt,
  });
}

function filterDatabaseAuditEvents(
  events: DatabaseAuditEvent[],
  input: { planId?: string; eventType?: string; limit?: unknown },
): DatabaseAuditEvent[] {
  let filtered = events;
  if (input.planId) {
    filtered = filtered.filter((event) => event.subject.planId === input.planId || event.subject.restorePlanId === input.planId);
  }
  if (input.eventType) {
    filtered = filtered.filter((event) => event.eventType === input.eventType);
  }
  const limit = typeof input.limit === 'number' && Number.isFinite(input.limit) && input.limit > 0 ? Math.floor(input.limit) : null;
  return limit ? filtered.slice(-limit) : filtered;
}

function databaseSnapshotFromInput(
  databaseTransactions: ReturnType<typeof ensureDatabaseTransactionState>,
  input: { snapshot?: unknown; snapshotId?: unknown },
): DatabaseSnapshot {
  if (input.snapshot && typeof input.snapshot === 'object' && !Array.isArray(input.snapshot)) {
    return objectValue<DatabaseSnapshot>(input.snapshot, 'snapshot');
  }
  if (typeof input.snapshotId === 'string' && input.snapshotId) {
    const snapshot = databaseTransactions.snapshots.find((item) => item.snapshotId === input.snapshotId);
    if (!snapshot) throw new Error('database snapshot not found');
    return snapshot;
  }
  throw new Error('snapshot or snapshot_id is required');
}

function databaseSnapshotSchemas(input: unknown): string[] {
  return Array.isArray(input) ? input.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())) : [];
}

function databaseApprovalScopesForToken(token: TokenRecord | null): string[] {
  const tokenScopes = token?.scopes ?? ['schema:apply_safe', 'schema:apply_destructive', 'database:admin'];
  const scopes = ['cumulus.plan.read', 'cumulus.apply'];
  if (tokenScopes.includes('schema:apply_destructive')) scopes.push('cumulus.approve.destructive');
  if (tokenScopes.includes('database:admin')) scopes.push('cumulus.approve.admin_override');
  return scopes;
}

function databaseApprovalActor(token: TokenRecord | null, fallbackId?: string): { principalId: string; type: 'human' | 'agent' | 'system' } {
  const actorType = approvalActorType(token);
  return {
    principalId: fallbackId || principalKey(token),
    type: actorType,
  };
}

async function persistDatabaseTransactionState(
  engine: CumulusDbEngine,
  dbId: string,
  state: SystemState,
): Promise<void> {
  ensureDatabaseTransactionState(state);
  await writeSystemState(engine, dbId, state);
}

export function createHandler(engine: CumulusDbEngine, config: CumulusDbConfig) {
  const limiter = new InMemoryRateLimiter();
  const passkeys = new LocalPasskeyStepUpStore();
  const oauth = new LocalOAuthProvider({
    issuer: config.publicUrl,
    publicUrl: config.publicUrl,
    masterKey: config.masterKey,
    engine,
  });

  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const parts = segments(url.pathname);

      if (req.method === 'GET' && (url.pathname === '/.well-known/openid-configuration' || url.pathname === '/.well-known/oauth-authorization-server')) {
        send(res, 200, oauth.discovery());
        return;
      }

      if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/oauth/authorize') {
        const body = req.method === 'POST' ? await readBodyObject(req) : Object.fromEntries(url.searchParams.entries());
        const email = stringValue(body.email ?? body.login_hint, 'unknown');
        if (!checkRateLimit(limiter, res, `login:${requestIp(req)}:${email}`, { max: 10, windowMs: 60_000 })) return;
        sendOAuth(res, await oauth.authorize(body));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/oauth/device_authorization') {
        if (!checkRateLimit(limiter, res, `device-login:${requestIp(req)}`, { max: 10, windowMs: 60_000 })) return;
        sendOAuth(res, await oauth.deviceAuthorization(await readBodyObject(req)));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/oauth/device_authorization/verify') {
        if (!checkRateLimit(limiter, res, `device-login:${requestIp(req)}`, { max: 10, windowMs: 60_000 })) return;
        sendOAuth(res, oauth.verifyDevice(await readBodyObject(req)));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/oauth/token') {
        const body = await readBodyObject(req);
        const deviceCode = stringValue(body.device_code);
        if (body.grant_type === 'urn:ietf:params:oauth:grant-type:device_code') {
          if (!checkRateLimit(limiter, res, `device-poll:${requestIp(req)}:${deviceCode}`, { max: 30, windowMs: 60_000 })) return;
        }
        sendOAuth(res, await oauth.token(body));
        return;
      }

      if ((req.method === 'GET' || req.method === 'POST') && url.pathname === '/oidc/userinfo') {
        sendOAuth(res, await oauth.userinfo(bearer(req)));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/health') {
        send(res, 200, { ok: true, service: 'cumulus-db' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/env/parse') {
        const body = await readJson(req);
        send(res, 200, parseEnvFile(stringValue(body.content)));
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/manifests:compile') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        const caller = await requireDbToken(engine, req, dbId, ['schema:plan']);
        const manifest = objectValue<NimbusDatabaseManifest>(body.manifest, 'manifest');
        const ir = compileDatabaseManifest(manifest);
        const state = await engine.getSystemState(dbId);
        const databaseTransactions = ensureDatabaseTransactionState(state);
        appendDatabaseManifestAuditEvents(databaseTransactions, {
          manifest,
          ir,
          actor: databaseAuditActorFromToken(caller),
        });
        await persistDatabaseTransactionState(engine, dbId, state);
        send(res, 200, {
          ir,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/plans') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        await requireDbToken(engine, req, dbId, ['schema:plan']);
        const ir = databaseIrFromBody(body);
        const currentState = await resolveDatabaseCurrentState(engine, body.currentState, ir.target, databaseIrSchemas(ir), 'currentState');
        const plan = createDatabasePlan({
          ir,
          currentState,
        });
        const state = await engine.getSystemState(dbId);
        const databaseTransactions = ensureDatabaseTransactionState(state);
        databaseTransactions.currentState = currentState;
        databaseTransactions.currentStateFingerprint = currentState.fingerprint;
        appendDatabasePlanAuditEvents(databaseTransactions, { plan, currentState });
        databaseTransactions.plans.push({
          plan,
          currentState,
          status: 'planned',
          createdAt: new Date().toISOString(),
          appliedAt: null,
          snapshotId: null,
          applyRunId: null,
        });
        await persistDatabaseTransactionState(engine, dbId, state);
        await writeSystemAudit(engine, dbId, {
          action: 'database.plan_create',
          actor: { type: 'system', id: 'database-planner' },
          target: { type: 'database_plan', id: plan.planId },
          metadata: { planHash: plan.planHash, highestRisk: plan.summary.highestRisk },
        });
        send(res, 200, {
          plan,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/plans:approve') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        const caller = await requireDbToken(engine, req, dbId, ['member:approve']);
        const state = await engine.getSystemState(dbId);
        const databaseTransactions = ensureDatabaseTransactionState(state);
        const planId = requiredString(body.planId, 'planId');
        const planRecord = databaseTransactions.plans.find((item) => item.plan.planId === planId);
        if (!planRecord) throw new Error('database plan not found');
        const actor = databaseApprovalActor(caller, typeof body.principalId === 'string' ? body.principalId : undefined);
        const approval = {
          ...createDatabaseApproval(planRecord.plan, {
            principalId: actor.principalId,
            type: actor.type,
            scopes: databaseApprovalScopesForToken(caller),
            reason: requiredString(body.reason, 'reason'),
          }),
            usedAt: null,
        };
        appendDatabaseApprovalAuditEvents(databaseTransactions, {
          plan: planRecord.plan,
          approval,
          actor: databaseAuditActorFromApproval(actor),
          reason: requiredString(body.reason, 'reason'),
        });
        databaseTransactions.approvals.push(approval);
        await persistDatabaseTransactionState(engine, dbId, state);
        await writeSystemAudit(engine, dbId, {
          action: 'database.plan_approval_create',
          actor: { type: actor.type, id: actor.principalId },
          target: { type: 'database_plan', id: planRecord.plan.planId },
          metadata: { approvalId: approval.approvalId, planHash: approval.planHash, expiresAt: approval.expiresAt },
        });
        send(res, 201, {
          approval,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/plans:apply') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        const state = await engine.getSystemState(dbId);
        const databaseTransactions = ensureDatabaseTransactionState(state);
        const planId = requiredString(body.planId, 'planId');
        const planRecord = databaseTransactions.plans.find((item) => item.plan.planId === planId);
        if (!planRecord) throw new Error('database plan not found');
        if (planRecord.status !== 'planned') throw new Error('database plan is not pending');
        const plan = planRecord.plan;
        const requiredScope = plan.summary.highestRisk === 'R0_NOOP' || plan.summary.highestRisk === 'R1_SAFE_ADDITIVE'
          ? 'schema:apply_safe'
          : 'schema:apply_destructive';
        const caller = await requireDbToken(engine, req, dbId, [requiredScope]);
        const approvalId = typeof body.approvalId === 'string' ? body.approvalId : undefined;
        const approval = approvalId
          ? databaseTransactions.approvals.find((item) => item.approvalId === approvalId && item.usedAt === null)
          : databaseTransactions.approvals.find((item) => item.planId === plan.planId && item.planHash === plan.planHash && item.usedAt === null);
        const currentState = await resolveDatabaseCurrentState(
          engine,
          body.currentState,
          plan.target,
          planRecordSchemas(planRecord),
          'currentState',
        );
        const actor = { principalId: principalKey(caller), kind: approvalActorType(caller) } as const;
        let apply: DatabaseApplyResult;
        try {
          apply = await applyDatabasePlan(engine, {
            plan,
            currentState,
            approval,
            actor,
          });
        } catch (error) {
          await recordDatabaseApplyFailure(engine, dbId, state, {
            planRecord,
            currentState,
            error,
            actor,
          });
          throw error;
        }
        const appliedAt = apply.applyRun.completedAt;
        planRecord.status = 'applied';
        planRecord.appliedAt = appliedAt;
        planRecord.applyRunId = apply.applyRun.applyRunId;
        planRecord.snapshotId = apply.snapshot?.snapshotId ?? null;
        if (approval) approval.usedAt = appliedAt;
        databaseTransactions.currentState = apply.state;
        databaseTransactions.currentStateFingerprint = apply.state.fingerprint;
        databaseTransactions.applyRuns.push(apply.applyRun);
        if (apply.snapshot) databaseTransactions.snapshots.push(apply.snapshot);
        appendDatabaseTransactionAuditEvents(databaseTransactions, apply.audit);
        await persistDatabaseTransactionState(engine, dbId, state);
        await writeSystemAudit(engine, dbId, {
          action: 'database.plan_apply',
          actor: { type: approvalActorType(caller), id: principalKey(caller) },
          target: { type: 'database_plan', id: plan.planId },
          metadata: {
            planHash: plan.planHash,
            applyRunId: apply.applyRun.applyRunId,
            snapshotId: apply.snapshot?.snapshotId ?? null,
            finalStateFingerprint: apply.state.fingerprint,
          },
        });
        send(res, 200, {
          apply,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/snapshots') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        const caller = await requireDbToken(engine, req, dbId, ['backup:create']);
        const target = objectValue<DatabaseTarget>(body.target, 'target');
        const currentState = await resolveDatabaseCurrentState(
          engine,
          body.currentState,
          target,
          databaseSnapshotSchemas(body.schemas),
          'currentState',
        );
        const snapshot = createDatabaseSnapshot(currentState, {
          reason: body.reason === 'revert_point' || body.reason === 'pre_destructive_apply' ? body.reason : 'manual',
          planId: typeof body.planId === 'string' ? body.planId : null,
        });
        const state = await engine.getSystemState(dbId);
        const databaseTransactions = ensureDatabaseTransactionState(state);
        databaseTransactions.currentState = currentState;
        databaseTransactions.currentStateFingerprint = currentState.fingerprint;
        databaseTransactions.snapshots.push(snapshot);
        appendDatabaseTransactionAuditEvent(databaseTransactions, {
          eventType: 'snapshot.created',
          actor: databaseAuditActorFromToken(caller),
          target: snapshot.target,
          subject: { planId: snapshot.planId, snapshotId: snapshot.snapshotId, stateFingerprint: snapshot.stateFingerprint },
          timestamp: snapshot.createdAt,
        });
        await persistDatabaseTransactionState(engine, dbId, state);
        send(res, 201, { snapshot });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/snapshots:restore') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        const caller = await requireDbToken(engine, req, dbId, ['schema:revert_local']);
        const restore = await restoreDatabaseSnapshotForRequest(engine, {
          snapshot: objectValue<DatabaseSnapshot>(body.snapshot, 'snapshot'),
          actor: { principalId: principalKey(caller), kind: approvalActorType(caller) },
        });
        if (restore.restore) {
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          persistDatabaseRestoreResult(databaseTransactions, restore.restore);
          await persistDatabaseTransactionState(engine, dbId, state);
          await writeSystemAudit(engine, dbId, {
            action: 'database.snapshot_restore',
            actor: { type: approvalActorType(caller), id: principalKey(caller) },
            target: { type: 'database_snapshot', id: restore.restore.snapshot.snapshotId },
            metadata: {
              restorePlanId: restore.restore.plan.planId,
              applyRunId: restore.restore.apply.applyRun.applyRunId,
              finalStateFingerprint: restore.state.fingerprint,
            },
          });
        }
        send(res, 200, {
          state: restore.state,
        });
        return;
      }

      if (req.method === 'GET' && url.pathname.startsWith('/v1/database/plans/')) {
        const dbId = requiredString(url.searchParams.get('dbId'), 'dbId');
        await requireDbToken(engine, req, dbId, ['schema:plan']);
        const planId = decodeURIComponent(url.pathname.slice('/v1/database/plans/'.length));
        const databaseTransactions = ensureDatabaseTransactionState(await engine.getSystemState(dbId));
        const planRecord = databaseTransactions.plans.find((item) => item.plan.planId === planId);
        if (!planRecord) throw new Error('database plan not found');
        send(res, 200, {
          plan: planRecord.plan,
          status: planRecord.status,
          currentState: planRecord.currentState,
          createdAt: planRecord.createdAt,
          appliedAt: planRecord.appliedAt,
          snapshotId: planRecord.snapshotId,
          applyRunId: planRecord.applyRunId,
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/database/audit') {
        const dbId = requiredString(url.searchParams.get('dbId'), 'dbId');
        await requireDbToken(engine, req, dbId, ['audit:read']);
        const databaseTransactions = ensureDatabaseTransactionState(await engine.getSystemState(dbId));
        const audit = filterDatabaseAuditEvents(databaseTransactions.audit, {
          planId: url.searchParams.get('planId') ?? undefined,
          eventType: url.searchParams.get('eventType') ?? undefined,
          limit: url.searchParams.has('limit') ? Number(url.searchParams.get('limit')) : undefined,
        });
        send(res, 200, {
          audit,
          ok: verifyDatabaseAuditChain(databaseTransactions.audit),
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/database/audit:verify') {
        const body = await readJson(req);
        const dbId = requiredString(body.dbId, 'dbId');
        await requireDbToken(engine, req, dbId, ['audit:read']);
        send(res, 200, {
          ok: verifyDatabaseAuditChain(Array.isArray(body.audit) ? (body.audit as DatabaseAuditEvent[]) : []),
        });
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/system/scopes') {
        send(res, 200, { scopes: SYSTEM_SCOPE_REGISTRY });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/system/agents/bootstrap') {
        if (!checkRateLimit(limiter, res, `bootstrap:${requestIp(req)}`, { max: 5, windowMs: 60_000 })) return;
        if (!config.publicAgentBootstrapEnabled && !isAdmin(req, config)) {
          send(res, 401, { error: 'agent bootstrap requires admin access' });
          return;
        }
        const body = await readJson(req);
        const bootstrap = await engine.bootstrapAgent({
          displayName: stringValue(body.displayName, 'bootstrap agent'),
          humanOwnerEmail: typeof body.humanOwnerEmail === 'string' ? body.humanOwnerEmail : null,
        });
        send(res, 201, bootstrap);
        return;
      }

      if (parts[0] === 'v1' && parts[1] === 'system') {
        if (parts[2] === 'passkeys' && parts[3] === 'step-up' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const caller = await requireDbToken(engine, req, dbId, ['member:approve']);
          if (!checkRateLimit(limiter, res, `approval:${dbId}:${principalKey(caller)}`, { max: 8, windowMs: 60_000 })) return;
          const stepUp = passkeys.create({ dbId, principalId: principalKey(caller) });
          await writeSystemAudit(engine, dbId, {
            action: 'system.passkey_step_up',
            actor: { type: principalType(caller), id: principalKey(caller) },
            target: { type: 'principal', id: principalKey(caller) },
            metadata: { method: stepUp.method, expiresAt: stepUp.expiresAt },
          });
          send(res, 201, { stepUp });
          return;
        }

        if ((parts[2] === 'org' || parts[2] === 'orgs') && parts[3] === 'claim' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          if (!checkRateLimit(limiter, res, `claim:${requestIp(req)}:${dbId}`, { max: 5, windowMs: 60_000 })) return;
          const caller = await requireDbToken(engine, req, dbId, ['org:claim']);
          const state = await engine.getSystemState(dbId);
          const principal = claimSystemOrg(state, { email: stringValue(body.email), now: new Date().toISOString() });
          await writeSystemState(engine, dbId, state);
          await writeSystemAudit(engine, dbId, {
            action: 'system.org_claim',
            actor: { type: principalType(caller), id: principalKey(caller) },
            target: { type: 'org', id: state.org.id },
            metadata: { humanOwnerEmail: state.org.humanOwnerEmail, principalId: principal.id },
          });
          send(res, 200, { org: state.org, principal });
          return;
        }

        if (parts[2] === 'grants' && req.method === 'GET') {
          const dbId = stringValue(url.searchParams.get('dbId'));
          await requireDbToken(engine, req, dbId, ['system:read']);
          const principalId = stringValue(url.searchParams.get('principalId'));
          const state = await engine.getSystemState(dbId);
          const principals = principalId
            ? state.principals.filter((principal) => principal.id === principalId)
            : state.principals;
          if (principalId && !principals.length) throw new Error('principal not found');
          send(res, 200, {
            principals: principals.map((principal) => ({
              id: principal.id,
              type: principal.type,
              displayName: principal.displayName,
              status: principal.status,
              grants: principal.grants,
            })),
          });
          return;
        }

        if (
          ((parts[2] === 'principals' && parts[3] && parts[4] === 'grants') || parts[2] === 'grants') &&
          (req.method === 'PATCH' || req.method === 'POST')
        ) {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const principalId = parts[2] === 'grants' ? stringValue(body.principalId) : parts[3];
          const grants = stringArray(body.grants) as TokenScope[];
          const caller = await requireDbToken(engine, req, dbId, ['member:approve']);
          if (!checkRateLimit(limiter, res, `approval:${dbId}:${principalKey(caller)}`, { max: 8, windowMs: 60_000 })) return;
          assertCanGrantHardScopes(caller, grants);
          const state = await engine.getSystemState(dbId);
          const principal = updateSystemPrincipalGrants(state, { principalId, grants });
          await writeSystemState(engine, dbId, state);
          await writeSystemAudit(engine, dbId, {
            action: 'system.principal_grants_update',
            actor: { type: principalType(caller), id: principalKey(caller) },
            target: { type: 'principal', id: principal.id },
            metadata: { grants: principal.grants },
          });
          send(res, 200, { principal });
          return;
        }

        if (parts[2] === 'agents' && parts[3] && parts[4] === 'disable' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const caller = await requireDbToken(engine, req, dbId, ['agent:disable']);
          if (!checkRateLimit(limiter, res, `destructive:${dbId}:${principalKey(caller)}:agent-disable`, { max: 8, windowMs: 60_000 })) return;
          const state = await engine.getSystemState(dbId);
          const principal = disableSystemAgent(state, parts[3]);
          await writeSystemState(engine, dbId, state);
          const tokens = await engine.readTokens(dbId);
          const disabledTokenIds = tokens
            .filter((token) => token.principalType === 'agent' && token.principalId === parts[3] && !token.revokedAt)
            .map((token) => token.id);
          for (const tokenId of disabledTokenIds) {
            await engine.revokeToken(dbId, tokenId);
          }
          await writeSystemAudit(engine, dbId, {
            action: 'system.agent_disable',
            actor: { type: principalType(caller), id: principalKey(caller) },
            target: { type: 'agent', id: principal.id },
            metadata: { disabledTokenIds },
          });
          send(res, 200, { principal, disabledTokenIds });
          return;
        }

        if (parts[2] === 'agents' && parts[3] && (parts[4] === 'rotate' || parts[4] === 'revoke') && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const agentId = parts[3];
          const caller = await requireDbToken(engine, req, dbId, ['token:revoke_any']);
          if (!checkRateLimit(limiter, res, `destructive:${dbId}:${principalKey(caller)}:agent-token-${parts[4]}`, { max: 8, windowMs: 60_000 })) return;
          const tokens = await engine.readTokens(dbId);
          const activeAgentTokens = tokens.filter(
            (token) => token.principalType === 'agent' && token.principalId === agentId && !token.revokedAt,
          );
          if (!activeAgentTokens.length) throw new Error('agent token not found');

          if (parts[4] === 'rotate') {
            const token = await engine.rotateToken(dbId, activeAgentTokens[0]!.id);
            await writeSystemAudit(engine, dbId, {
              action: 'system.agent_token_rotate',
              actor: { type: principalType(caller), id: principalKey(caller) },
              target: { type: 'agent', id: agentId },
              metadata: { rotatedFromId: activeAgentTokens[0]!.id },
            });
            send(res, 200, { token });
            return;
          }

          const revokedTokenIds: string[] = [];
          for (const token of activeAgentTokens) {
            await engine.revokeToken(dbId, token.id);
            revokedTokenIds.push(token.id);
          }
          await writeSystemAudit(engine, dbId, {
            action: 'system.agent_token_revoke',
            actor: { type: principalType(caller), id: principalKey(caller) },
            target: { type: 'agent', id: agentId },
            metadata: { revokedTokenIds },
          });
          send(res, 200, { revokedTokenIds });
          return;
        }

        if (req.method === 'GET' && parts[2] === 'state') {
          const dbId = stringValue(url.searchParams.get('dbId'));
          await requireDbToken(engine, req, dbId, ['system:read']);
          send(res, 200, { system: publicSystemState(await engine.getSystemState(dbId)) });
          return;
        }

        if (req.method === 'GET' && parts[2] === 'audit') {
          const dbId = stringValue(url.searchParams.get('dbId'));
          await requireDbToken(engine, req, dbId, ['audit:read']);
          send(res, 200, { audit: await engine.listAudit(dbId, Number(url.searchParams.get('limit') ?? 100)) });
          return;
        }

        if (parts[2] === 'schema' && parts[3] === 'plan' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          await requireDbToken(engine, req, dbId, ['schema:plan']);
          send(res, 200, {
            plan: await engine.planSchema(dbId, {
              source: typeof body.source === 'string' ? body.source : undefined,
              desired:
                body.desired && typeof body.desired === 'object' && !Array.isArray(body.desired)
                  ? (body.desired as NimbusIr)
                  : undefined,
              fileName: typeof body.fileName === 'string' ? body.fileName : undefined,
            }),
          });
          return;
        }

        if (parts[2] === 'schema' && parts[3] === 'approvals' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const caller = await requireDbToken(engine, req, dbId, ['member:approve']);
          if (!checkRateLimit(limiter, res, `approval:${dbId}:${principalKey(caller)}`, { max: 8, windowMs: 60_000 })) return;
          const isHumanApproval = principalType(caller) === 'human';
          if (body.kind === 'revert') {
            if (
              isHumanApproval &&
              !passkeys.verify({ dbId, principalId: principalKey(caller), stepUpToken: typeof body.stepUpToken === 'string' ? body.stepUpToken : undefined })
            ) {
              send(res, 400, { error: 'recent passkey step-up required for destructive approval' });
              return;
            }
            send(res, 201, {
              approval: await engine.createRevertApproval(dbId, {
                versionId: typeof body.versionId === 'string' ? body.versionId : undefined,
                snapshotId: typeof body.snapshotId === 'string' ? body.snapshotId : undefined,
                actorType: approvalActorType(caller),
                actorId: principalKey(caller),
              }),
            });
            return;
          }
          const state = await engine.getSystemState(dbId);
          const plan = state.schema.plans.find((item) => item.id === stringValue(body.planId));
          if (plan?.approvalRequired && isHumanApproval) {
            const verified = passkeys.verify({
              dbId,
              principalId: principalKey(caller),
              stepUpToken: typeof body.stepUpToken === 'string' ? body.stepUpToken : undefined,
            });
            if (!verified) {
              send(res, 400, { error: 'recent passkey step-up required for destructive approval' });
              return;
            }
          }
          send(res, 201, {
            approval: await engine.createSchemaApproval(dbId, stringValue(body.planId), approvalActorType(caller), principalKey(caller)),
          });
          return;
        }

        if (parts[2] === 'schema' && parts[3] === 'apply' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const state = await engine.getSystemState(dbId);
          const plan = state.schema.plans.find((item) => item.id === stringValue(body.planId));
          const caller = await requireDbToken(engine, req, dbId, [plan?.riskLevel === 'destructive' ? 'schema:apply_destructive' : 'schema:apply_safe']);
          if (
            plan?.riskLevel === 'destructive' &&
            !checkRateLimit(limiter, res, `destructive:${dbId}:${principalKey(caller)}:schema-apply`, { max: 8, windowMs: 60_000 })
          ) {
            return;
          }
          send(res, 200, {
            apply: publicApplyResult(
              await engine.applySchemaPlan(dbId, {
                planId: stringValue(body.planId),
                approvalToken: typeof body.approvalToken === 'string' ? body.approvalToken : undefined,
                actorType: approvalActorType(caller),
                actorId: principalKey(caller),
              }),
            ),
          });
          return;
        }

        if (parts[2] === 'schema' && parts[3] === 'revert' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const caller = await requireDbToken(engine, req, dbId, ['schema:revert_local']);
          if (!checkRateLimit(limiter, res, `destructive:${dbId}:${principalKey(caller)}:schema-revert`, { max: 8, windowMs: 60_000 })) return;
          send(res, 200, {
            revert: publicApplyResult(
              await engine.revertSchema(dbId, {
                versionId: typeof body.versionId === 'string' ? body.versionId : undefined,
                snapshotId: typeof body.snapshotId === 'string' ? body.snapshotId : undefined,
                approvalToken: typeof body.approvalToken === 'string' ? body.approvalToken : undefined,
                actorType: approvalActorType(caller),
                actorId: principalKey(caller),
              }),
            ),
          });
          return;
        }

        if (parts[2] === 'snapshots' && req.method === 'GET') {
          const dbId = stringValue(url.searchParams.get('dbId'));
          await requireDbToken(engine, req, dbId, ['system:read']);
          send(res, 200, { snapshots: (await engine.getSystemState(dbId)).schema.snapshots.map(publicSnapshot) });
          return;
        }

        if (parts[2] === 'snapshots' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          await requireDbToken(engine, req, dbId, ['backup:create']);
          const kind = body.kind === 'pre_apply' || body.kind === 'revert_point' ? body.kind : 'manual';
          send(res, 201, { snapshot: publicSnapshot(await engine.createSystemSnapshot(dbId, kind)) });
          return;
        }
      }

      if (req.method === 'POST' && url.pathname === '/v1/relay/signup') {
        const raw = await readBody(req);
        if (!verifyRelaySignature(raw, req, config.relayWebhookSecret)) {
          send(res, 401, { error: 'invalid relay signature' });
          return;
        }
        const body = raw.trim() ? (JSON.parse(raw) as Record<string, unknown>) : {};
        const kind = stringValue(body.kind, 'signup');
        if (kind === 'signup') {
          const input =
            body.input && typeof body.input === 'object' && !Array.isArray(body.input)
              ? (body.input as Record<string, unknown>)
              : {};
          const created = await engine.createWorkspace({
            ownerAgentId: stringValue(input.agent_id, stringValue(body.signupId, 'relay-agent')),
            humanOwnerEmail: stringValue(input.email, stringValue(body.email, '')) || null,
            relaySignupId: stringValue(body.signupId, null as never) || null,
          });
          const credentials = {
            endpoint: config.publicUrl,
            database_id: created.manifest.id,
            data_token: created.dataToken.token,
            admin_token: created.adminToken.token,
          };
          send(res, 200, {
            accountId: created.manifest.id,
            externalId: created.manifest.id,
            credentials,
            apiKey: JSON.stringify(credentials),
          });
          return;
        }
        if (kind === 'create_api_key') {
          const accountId = stringValue(body.account_id);
          const issued = await engine.createToken(accountId, stringValue(body.label, 'relay key'), [
            'records:read',
            'records:write',
            'search:read',
            'events:write',
            'kv:read',
            'kv:write',
            'secrets:write',
          ]);
          send(res, 200, { key: issued.token, providerKeyId: issued.id });
          return;
        }
        if (kind === 'revoke_api_key') {
          await engine.revokeToken(stringValue(body.account_id), stringValue(body.key_id));
          send(res, 200, { revoked: true });
          return;
        }
        if (kind === 'teardown') {
          send(res, 200, { deleted: false, retained: true });
          return;
        }
      }

      if (req.method === 'GET' && url.pathname === '/v1/databases') {
        if (!isAdmin(req, config)) {
          send(res, 401, { error: 'unauthorized' });
          return;
        }
        send(res, 200, { databases: await engine.listWorkspaces() });
        return;
      }

      if (parts[0] === 'v1' && parts[1] === 'databases' && parts[2]) {
        const dbId = parts[2];
        const area = parts[3];

        if (req.method === 'GET' && !area) {
          await requireAccess(engine, config, req, dbId, ['records:read']);
          send(res, 200, { database: await engine.getManifest(dbId), records: await engine.listRecords(dbId) });
          return;
        }

        if (area === 'records' && req.method === 'GET' && !parts[4]) {
          await requireAccess(engine, config, req, dbId, ['records:read']);
          send(res, 200, { records: await engine.listRecords(dbId) });
          return;
        }

        if (area === 'records' && req.method === 'POST' && !parts[4]) {
          await requireAccess(engine, config, req, dbId, ['records:write']);
          send(res, 201, { record: await engine.writeRecord(dbId, recordInput(await readJson(req))) });
          return;
        }

        if (area === 'records' && parts[4]) {
          if (req.method === 'GET') {
            await requireAccess(engine, config, req, dbId, ['records:read']);
            const record = await engine.getRecord(dbId, parts[4]);
            if (!record) send(res, 404, { error: 'record not found' });
            else send(res, 200, { record });
            return;
          }
          if (req.method === 'PATCH') {
            await requireAccess(engine, config, req, dbId, ['records:write']);
            send(res, 200, { record: await engine.updateRecord(dbId, { id: parts[4], ...recordInput(await readJson(req)) }) });
            return;
          }
          if (req.method === 'DELETE') {
            await requireAccess(engine, config, req, dbId, ['records:write']);
            await engine.deleteRecord(dbId, parts[4]);
            sendNoContent(res);
            return;
          }
        }

        if (area === 'search' && req.method === 'POST') {
          await requireAccess(engine, config, req, dbId, ['search:read']);
          const body = await readJson(req);
          send(res, 200, {
            hits: await engine.search(dbId, {
              query: typeof body.query === 'string' ? body.query : undefined,
              vector: numberArray(body.vector),
              type: typeof body.type === 'string' ? (body.type as RecordType) : undefined,
              limit: typeof body.limit === 'number' ? body.limit : undefined,
            }),
          });
          return;
        }

        if (area === 'kv' && req.method === 'PUT' && parts[4]) {
          await requireAccess(engine, config, req, dbId, ['kv:write']);
          const body = await readJson(req);
          send(res, 200, { record: await engine.putKeyValue(dbId, parts[4], body.value, body.metadata as Record<string, unknown> | undefined) });
          return;
        }

        if (area === 'kv' && req.method === 'GET' && parts[4]) {
          await requireAccess(engine, config, req, dbId, ['kv:read']);
          const record = await engine.getKeyValue(dbId, parts[4]);
          if (!record) send(res, 404, { error: 'key not found' });
          else send(res, 200, { record });
          return;
        }

        if (area === 'events' && req.method === 'POST') {
          await requireAccess(engine, config, req, dbId, ['events:write']);
          send(res, 201, { record: await engine.appendEvent(dbId, recordInput(await readJson(req))) });
          return;
        }

        if (area === 'tokens' && req.method === 'GET') {
          await requireAccess(engine, config, req, dbId, ['tokens:manage']);
          send(res, 200, {
            tokens: (await engine.readTokens(dbId)).map(publicTokenRecord),
          });
          return;
        }

        if (area === 'tokens' && req.method === 'POST') {
          const body = await readJson(req);
          const requestedScopes = stringArray(body.scopes) as TokenScope[];
          const hardScopesRequested = requestedScopes.some((scope) => isHardSystemScope(scope));
          const caller = await requireAccess(engine, config, req, dbId, hardScopesRequested ? ['token:create'] : ['tokens:manage']);
          if (hardScopesRequested) assertCanGrantHardScopes(caller, requestedScopes);
          send(res, 201, {
            token: await engine.createToken(dbId, stringValue(body.label, 'manual token'), requestedScopes),
          });
          return;
        }

        if (area === 'tokens' && parts[4] && parts[5] === 'rotate' && req.method === 'POST') {
          await requireAccess(engine, config, req, dbId, ['tokens:manage']);
          send(res, 200, { token: await engine.rotateToken(dbId, parts[4]) });
          return;
        }

        if (area === 'tokens' && parts[4] && req.method === 'DELETE') {
          await requireAccess(engine, config, req, dbId, ['tokens:manage']);
          await engine.revokeToken(dbId, parts[4]);
          sendNoContent(res);
          return;
        }

        if (area === 'secrets' && parts[4] === 'reveal' && req.method === 'POST') {
          await requireAccess(engine, config, req, dbId, ['secrets:reveal']);
          const body = await readJson(req);
          send(res, 200, {
            secret: await engine.revealSecret(dbId, stringValue(body.recordId), typeof body.field === 'string' ? body.field : undefined),
          });
          return;
        }

        if (area === 'backups' && req.method === 'POST') {
          await requireAccess(engine, config, req, dbId, ['backups:manage']);
          send(res, 201, { backup: await engine.backup(dbId) });
          return;
        }

        if (area === 'compact' && req.method === 'POST') {
          await requireAccess(engine, config, req, dbId, ['backups:manage']);
          send(res, 200, { compaction: await engine.compact(dbId) });
          return;
        }
      }

      if (req.method === 'GET' && url.pathname === '/mcp') {
        send(res, 200, {
          name: 'cumulus-database',
          tools: MCP_TOOL_NAMES,
          toolSchemas: MCP_TOOL_SCHEMAS,
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/mcp') {
        const body = await readJson(req);
        const tool = stringValue(body.tool) || stringValue((body.params as Record<string, unknown> | undefined)?.name);
        const args = (body.arguments ??
          (body.params as Record<string, unknown> | undefined)?.arguments ??
          {}) as Record<string, unknown>;
        validateMcpArguments(tool, args);
        const dbId = stringValue(args.database_id);
        const token = stringValue(args.token);
        const fakeReq = { headers: { authorization: `Bearer ${token}` } } as IncomingMessage;
        if (tool === 'cumulus_db_parse_env') {
          send(res, 200, { result: parseEnvFile(stringValue(args.content)) });
          return;
        }
        if (tool === 'cumulus_db_create_record') {
          await requireDbToken(engine, fakeReq, dbId, ['records:write']);
          send(res, 200, { result: await engine.writeRecord(dbId, recordInput(args)) });
          return;
        }
        if (tool === 'cumulus_db_search') {
          await requireDbToken(engine, fakeReq, dbId, ['search:read']);
          send(res, 200, {
            result: await engine.search(dbId, {
              query: stringValue(args.query),
              vector: numberArray(args.vector),
              type: typeof args.type === 'string' ? (args.type as RecordType) : undefined,
              limit: typeof args.limit === 'number' ? args.limit : undefined,
            }),
          });
          return;
        }
        if (tool === 'cumulus_db_append_event') {
          await requireDbToken(engine, fakeReq, dbId, ['events:write']);
          send(res, 200, { result: await engine.appendEvent(dbId, recordInput(args)) });
          return;
        }
        if (tool === 'cumulus_db_put_kv') {
          await requireDbToken(engine, fakeReq, dbId, ['kv:write']);
          send(res, 200, {
            result: await engine.putKeyValue(
              dbId,
              stringValue(args.key),
              args.value,
              args.metadata as Record<string, unknown> | undefined,
            ),
          });
          return;
        }
        if (tool === 'cumulus_db_get_kv') {
          await requireDbToken(engine, fakeReq, dbId, ['kv:read']);
          const record = await engine.getKeyValue(dbId, stringValue(args.key));
          if (!record) send(res, 404, { error: 'key not found' });
          else send(res, 200, { result: record });
          return;
        }
        if (tool === 'cumulus_db_reveal_secret') {
          await requireDbToken(engine, fakeReq, dbId, ['secrets:reveal']);
          send(res, 200, {
            result: await engine.revealSecret(
              dbId,
              stringValue(args.record_id ?? args.recordId),
              typeof args.field === 'string' ? args.field : undefined,
            ),
          });
          return;
        }
        if (tool === 'cumulus.plan_schema') {
          await requireDbToken(engine, fakeReq, dbId, ['schema:plan']);
          send(res, 200, {
            result: await engine.planSchema(dbId, {
              source: typeof args.source === 'string' ? args.source : undefined,
              desired:
                args.desired && typeof args.desired === 'object' && !Array.isArray(args.desired)
                  ? (args.desired as NimbusIr)
                  : undefined,
            }),
          });
          return;
        }
        if (tool === 'cumulus.compile_manifest') {
          const caller = await requireDbToken(engine, fakeReq, dbId, ['schema:plan']);
          const manifest = objectValue<NimbusDatabaseManifest>(args.manifest, 'manifest');
          const ir = compileDatabaseManifest(manifest);
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          appendDatabaseManifestAuditEvents(databaseTransactions, {
            manifest,
            ir,
            actor: databaseAuditActorFromToken(caller),
          });
          await persistDatabaseTransactionState(engine, dbId, state);
          send(res, 200, {
            result: ir,
          });
          return;
        }
        if (tool === 'cumulus.create_plan') {
          await requireDbToken(engine, fakeReq, dbId, ['schema:plan']);
          const ir =
            args.ir && typeof args.ir === 'object' && !Array.isArray(args.ir)
              ? (args.ir as NimbusDatabaseIr)
              : compileDatabaseManifest(objectValue<NimbusDatabaseManifest>(args.manifest, 'manifest'));
          const currentState = await resolveDatabaseCurrentState(
            engine,
            args.current_state ?? args.currentState,
            ir.target,
            databaseIrSchemas(ir),
            'current_state',
          );
          const plan = createDatabasePlan({
            ir,
            currentState,
          });
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          databaseTransactions.currentState = currentState;
          databaseTransactions.currentStateFingerprint = currentState.fingerprint;
          appendDatabasePlanAuditEvents(databaseTransactions, { plan, currentState });
          databaseTransactions.plans.push({
            plan,
            currentState,
            status: 'planned',
            createdAt: new Date().toISOString(),
            appliedAt: null,
            snapshotId: null,
            applyRunId: null,
          });
          await persistDatabaseTransactionState(engine, dbId, state);
          send(res, 200, { result: plan });
          return;
        }
        if (tool === 'cumulus.get_plan') {
          await requireDbToken(engine, fakeReq, dbId, ['schema:plan']);
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          const planId = requiredString(args.plan_id ?? args.planId, 'plan_id');
          const planRecord = databaseTransactions.plans.find((item) => item.plan.planId === planId);
          if (!planRecord) throw new Error('database plan not found');
          send(res, 200, {
            result: {
              plan: planRecord.plan,
              status: planRecord.status,
              currentState: planRecord.currentState,
              createdAt: planRecord.createdAt,
              appliedAt: planRecord.appliedAt,
              snapshotId: planRecord.snapshotId,
              applyRunId: planRecord.applyRunId,
            },
          });
          return;
        }
        if (tool === 'cumulus.classify_risk') {
          await requireDbToken(engine, fakeReq, dbId, ['schema:plan']);
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          const planId = requiredString(args.plan_id ?? args.planId, 'plan_id');
          const plan = databaseTransactions.plans.find((item) => item.plan.planId === planId)?.plan;
          if (!plan) throw new Error('database plan not found');
          appendDatabaseTransactionAuditEvent(databaseTransactions, {
            eventType: 'risk.classified',
            actor: { principalId: 'database-planner', kind: 'system' },
            target: plan.target,
            subject: { planId: plan.planId, planHash: plan.planHash },
            decision: {
              creates: plan.summary.creates,
              updates: plan.summary.updates,
              drops: plan.summary.drops,
              destructive: plan.summary.destructive,
              highestRisk: plan.summary.highestRisk,
              approvalRequired: plan.summary.approvalRequired,
              snapshotRequired: plan.summary.snapshotRequired,
            },
            timestamp: new Date().toISOString(),
          });
          await persistDatabaseTransactionState(engine, dbId, state);
          send(res, 200, { result: { summary: plan.summary, steps: plan.steps.map((step) => ({ stepId: step.stepId, op: step.op, object: step.object, risk: step.risk })) } });
          return;
        }
        if (tool === 'cumulus.request_database_approval') {
          const caller = await requireDbToken(engine, fakeReq, dbId, ['member:approve']);
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          const planId = requiredString(args.plan_id ?? args.planId, 'plan_id');
          const planRecord = databaseTransactions.plans.find((item) => item.plan.planId === planId);
          if (!planRecord) throw new Error('database plan not found');
          const actor = databaseApprovalActor(caller);
          const approval = {
            ...createDatabaseApproval(planRecord.plan, {
              principalId: actor.principalId,
              type: actor.type,
              scopes: databaseApprovalScopesForToken(caller),
              reason: requiredString(args.reason, 'reason'),
            }),
            usedAt: null,
          };
          appendDatabaseApprovalAuditEvents(databaseTransactions, {
            plan: planRecord.plan,
            approval,
            actor: databaseAuditActorFromApproval(actor),
            reason: requiredString(args.reason, 'reason'),
          });
          databaseTransactions.approvals.push(approval);
          await persistDatabaseTransactionState(engine, dbId, state);
          send(res, 200, {
            result: approval,
          });
          return;
        }
        if (tool === 'cumulus.apply_plan') {
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          const planId = requiredString(args.plan_id ?? args.planId, 'plan_id');
          const planRecord = databaseTransactions.plans.find((item) => item.plan.planId === planId);
          if (!planRecord) throw new Error('database plan not found');
          if (planRecord.status !== 'planned') throw new Error('database plan is not pending');
          const plan = planRecord.plan;
          const requiredScope = plan.summary.highestRisk === 'R0_NOOP' || plan.summary.highestRisk === 'R1_SAFE_ADDITIVE'
            ? 'schema:apply_safe'
            : 'schema:apply_destructive';
          const caller = await requireDbToken(engine, fakeReq, dbId, [requiredScope]);
          const approvalId = typeof args.approval_id === 'string' ? args.approval_id : typeof args.approvalId === 'string' ? args.approvalId : undefined;
          const approval = approvalId
            ? databaseTransactions.approvals.find((item) => item.approvalId === approvalId && item.usedAt === null)
            : databaseTransactions.approvals.find((item) => item.planId === plan.planId && item.planHash === plan.planHash && item.usedAt === null);
          const currentState = await resolveDatabaseCurrentState(
            engine,
            args.current_state ?? args.currentState,
            plan.target,
            planRecordSchemas(planRecord),
            'current_state',
          );
          const actor = { principalId: principalKey(caller), kind: approvalActorType(caller) } as const;
          let apply: DatabaseApplyResult;
          try {
            apply = await applyDatabasePlan(engine, {
              plan,
              currentState,
              approval,
              actor,
            });
          } catch (error) {
            await recordDatabaseApplyFailure(engine, dbId, state, {
              planRecord,
              currentState,
              error,
              actor,
            });
            throw error;
          }
          const appliedAt = apply.applyRun.completedAt;
          planRecord.status = 'applied';
          planRecord.appliedAt = appliedAt;
          planRecord.applyRunId = apply.applyRun.applyRunId;
          planRecord.snapshotId = apply.snapshot?.snapshotId ?? null;
          if (approval) approval.usedAt = appliedAt;
          databaseTransactions.currentState = apply.state;
          databaseTransactions.currentStateFingerprint = apply.state.fingerprint;
          databaseTransactions.applyRuns.push(apply.applyRun);
          if (apply.snapshot) databaseTransactions.snapshots.push(apply.snapshot);
          appendDatabaseTransactionAuditEvents(databaseTransactions, apply.audit);
          await persistDatabaseTransactionState(engine, dbId, state);
          send(res, 200, { result: apply });
          return;
        }
        if (tool === 'cumulus.restore_snapshot' || tool === 'cumulus.revert') {
          const caller = await requireDbToken(engine, fakeReq, dbId, ['schema:revert_local']);
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          const snapshot = databaseSnapshotFromInput(databaseTransactions, {
            snapshot: args.snapshot,
            snapshotId: args.snapshot_id ?? args.snapshotId,
          });
          const restore = await restoreDatabaseSnapshotForRequest(engine, {
            snapshot,
            actor: { principalId: principalKey(caller), kind: approvalActorType(caller) },
          });
          if (restore.restore) {
            const state = await engine.getSystemState(dbId);
            const databaseTransactions = ensureDatabaseTransactionState(state);
            persistDatabaseRestoreResult(databaseTransactions, restore.restore);
            await persistDatabaseTransactionState(engine, dbId, state);
          }
          send(res, 200, { result: restore.state });
          return;
        }
        if (tool === 'cumulus.verify_audit_chain') {
          await requireDbToken(engine, fakeReq, dbId, ['audit:read']);
          send(res, 200, { result: { ok: verifyDatabaseAuditChain(Array.isArray(args.audit) ? (args.audit as DatabaseAuditEvent[]) : []) } });
          return;
        }
        if (tool === 'cumulus.get_audit_events') {
          await requireDbToken(engine, fakeReq, dbId, ['audit:read']);
          const databaseTransactions = ensureDatabaseTransactionState(await engine.getSystemState(dbId));
          const audit = filterDatabaseAuditEvents(databaseTransactions.audit, {
            planId: typeof args.plan_id === 'string' ? args.plan_id : typeof args.planId === 'string' ? args.planId : undefined,
            eventType: typeof args.event_type === 'string' ? args.event_type : typeof args.eventType === 'string' ? args.eventType : undefined,
            limit: args.limit,
          });
          send(res, 200, { result: { audit, ok: verifyDatabaseAuditChain(databaseTransactions.audit) } });
          return;
        }
        if (tool === 'cumulus.read_system_state') {
          await requireDbToken(engine, fakeReq, dbId, ['system:read']);
          send(res, 200, { result: publicSystemState(await engine.getSystemState(dbId)) });
          return;
        }
        if (tool === 'cumulus.request_approval') {
          const caller = await requireDbToken(engine, fakeReq, dbId, ['member:approve']);
          const state = await engine.getSystemState(dbId);
          const databaseTransactions = ensureDatabaseTransactionState(state);
          const planId = typeof args.plan_id === 'string' ? args.plan_id : typeof args.planId === 'string' ? args.planId : undefined;
          const databasePlanRecord = planId ? databaseTransactions.plans.find((item) => item.plan.planId === planId) : undefined;
          if (databasePlanRecord && typeof args.reason === 'string') {
            const actor = databaseApprovalActor(caller);
            const approval = {
              ...createDatabaseApproval(databasePlanRecord.plan, {
                principalId: actor.principalId,
                type: actor.type,
                scopes: databaseApprovalScopesForToken(caller),
                reason: args.reason,
              }),
              usedAt: null,
            };
            appendDatabaseApprovalAuditEvents(databaseTransactions, {
              plan: databasePlanRecord.plan,
              approval,
              actor: databaseAuditActorFromApproval(actor),
              reason: args.reason,
            });
            databaseTransactions.approvals.push(approval);
            await persistDatabaseTransactionState(engine, dbId, state);
            send(res, 200, { result: approval });
            return;
          }
          if (args.kind === 'revert') {
            send(res, 200, {
              result: await engine.createRevertApproval(dbId, {
                versionId: typeof args.version_id === 'string' ? args.version_id : typeof args.versionId === 'string' ? args.versionId : undefined,
                snapshotId: typeof args.snapshot_id === 'string' ? args.snapshot_id : typeof args.snapshotId === 'string' ? args.snapshotId : undefined,
              }),
            });
            return;
          }
          send(res, 200, { result: await engine.createSchemaApproval(dbId, stringValue(args.plan_id ?? args.planId)) });
          return;
        }
        if (tool === 'cumulus.apply_schema') {
          const state = await engine.getSystemState(dbId);
          const plan = state.schema.plans.find((item) => item.id === stringValue(args.plan_id ?? args.planId));
          await requireDbToken(engine, fakeReq, dbId, [plan?.riskLevel === 'destructive' ? 'schema:apply_destructive' : 'schema:apply_safe']);
          send(res, 200, {
            result: publicApplyResult(
              await engine.applySchemaPlan(dbId, {
                planId: stringValue(args.plan_id ?? args.planId),
                approvalToken: typeof args.approval_token === 'string' ? args.approval_token : typeof args.approvalToken === 'string' ? args.approvalToken : undefined,
              }),
            ),
          });
          return;
        }
        if (tool === 'cumulus.create_snapshot') {
          const caller = await requireDbToken(engine, fakeReq, dbId, ['backup:create']);
          if (args.target && typeof args.target === 'object' && !Array.isArray(args.target)) {
            const target = objectValue<DatabaseTarget>(args.target, 'target');
            const currentState = await resolveDatabaseCurrentState(
              engine,
              args.current_state ?? args.currentState,
              target,
              databaseSnapshotSchemas(args.schemas),
              'current_state',
            );
            const snapshot = createDatabaseSnapshot(currentState, {
              reason: args.reason === 'revert_point' || args.reason === 'pre_destructive_apply' ? args.reason : 'manual',
              planId: typeof args.plan_id === 'string' ? args.plan_id : typeof args.planId === 'string' ? args.planId : null,
            });
            const state = await engine.getSystemState(dbId);
            const databaseTransactions = ensureDatabaseTransactionState(state);
            databaseTransactions.currentState = currentState;
            databaseTransactions.currentStateFingerprint = currentState.fingerprint;
            databaseTransactions.snapshots.push(snapshot);
            appendDatabaseTransactionAuditEvent(databaseTransactions, {
              eventType: 'snapshot.created',
              actor: databaseAuditActorFromToken(caller),
              target: snapshot.target,
              subject: { planId: snapshot.planId, snapshotId: snapshot.snapshotId, stateFingerprint: snapshot.stateFingerprint },
              timestamp: snapshot.createdAt,
            });
            await persistDatabaseTransactionState(engine, dbId, state);
            send(res, 200, { result: snapshot });
            return;
          }
          send(res, 200, { result: publicSnapshot(await engine.createSystemSnapshot(dbId)) });
          return;
        }
        if (tool === 'cumulus.revert_version') {
          await requireDbToken(engine, fakeReq, dbId, ['schema:revert_local']);
          send(res, 200, {
            result: publicApplyResult(
              await engine.revertSchema(dbId, {
                versionId: typeof args.version_id === 'string' ? args.version_id : typeof args.versionId === 'string' ? args.versionId : undefined,
                snapshotId: typeof args.snapshot_id === 'string' ? args.snapshot_id : typeof args.snapshotId === 'string' ? args.snapshotId : undefined,
                approvalToken: typeof args.approval_token === 'string' ? args.approval_token : typeof args.approvalToken === 'string' ? args.approvalToken : undefined,
              }),
            ),
          });
          return;
        }
        if (tool === 'cumulus.rotate_self_token') {
          const tokenRecord = await engine.authenticate(dbId, token, ['token:rotate_self']);
          send(res, 200, { result: await engine.rotateToken(dbId, tokenRecord.id) });
          return;
        }
        send(res, 404, { error: `unknown tool: ${tool}` });
        return;
      }

      send(res, 404, { error: 'not found' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      send(res, message === 'unauthorized' ? 401 : 400, { error: message });
    }
  };
}
