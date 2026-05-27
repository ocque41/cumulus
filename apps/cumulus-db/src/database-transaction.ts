// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, randomUUID } from 'node:crypto';
import { canonicalStringify } from './nimbus.js';

export const NIMBUS_DB_API_VERSION = 'nimbus.db/v0.1';
export const NIMBUS_DB_KIND = 'DatabaseManifest';
export const NIMBUS_DB_IR_VERSION = 'nimbus.db.ir/v0.1';
export const CUMULUS_DB_PLAN_VERSION = 'cumulus.plan/v0.1';
export const CUMULUS_DB_RISK_POLICY_VERSION = 'risk.policy/v0.1';

export type DatabaseEngine = 'postgres';

export type DatabasePlanOperation =
  | 'noop'
  | 'create_schema'
  | 'create_table'
  | 'add_column'
  | 'alter_column_nullable'
  | 'alter_column_type'
  | 'add_index'
  | 'add_unique_constraint'
  | 'drop_index'
  | 'drop_column'
  | 'drop_table'
  | 'rename_column'
  | 'rename_table'
  | 'raw_sql_blocked_by_default';

export type DatabaseRiskLevel =
  | 'R0_NOOP'
  | 'R1_SAFE_ADDITIVE'
  | 'R2_OPERATIONAL'
  | 'R3_DATA_DEPENDENT'
  | 'R4_BACKWARD_INCOMPATIBLE'
  | 'R5_DESTRUCTIVE'
  | 'R6_IRREVERSIBLE_OR_UNKNOWN';

export interface NimbusDatabaseManifest {
  apiVersion: typeof NIMBUS_DB_API_VERSION;
  kind: typeof NIMBUS_DB_KIND;
  metadata: {
    name: string;
    workspace?: string;
  };
  target: DatabaseTarget;
  resources: {
    schemas?: DatabaseSchemaInput[];
    tables?: DatabaseTableInput[];
    rawSql?: string[];
  };
  policies?: {
    destructiveChanges?: 'block' | 'require_approval';
    snapshotBefore?: Array<'destructive' | 'irreversible' | 'high'>;
  };
}

export interface DatabaseTarget {
  engine: DatabaseEngine;
  database: string;
  environment?: string;
}

export interface DatabaseSchemaInput {
  name: string;
}

export interface DatabaseTableInput {
  schema?: string;
  name: string;
  renameFrom?: string | { schema?: string; name: string };
  columns: DatabaseColumnInput[];
  indexes?: DatabaseIndexInput[];
}

export interface DatabaseColumnInput {
  name: string;
  renameFrom?: string;
  type: string;
  nullable?: boolean;
  primaryKey?: boolean;
  unique?: boolean;
  default?: string;
}

export interface DatabaseIndexInput {
  name?: string;
  columns: string[];
  unique?: boolean;
}

export interface NimbusDatabaseIr {
  irVersion: typeof NIMBUS_DB_IR_VERSION;
  manifestHash: string;
  metadata: NimbusDatabaseManifest['metadata'];
  target: DatabaseTarget;
  resources: {
    schemas: DatabaseSchema[];
    tables: DatabaseTable[];
    rawSql: string[];
  };
  policies: Required<NonNullable<NimbusDatabaseManifest['policies']>>;
  hash: string;
}

export interface DatabaseSchema {
  id: string;
  name: string;
}

export interface DatabaseTable {
  id: string;
  schema: string;
  name: string;
  renameFrom?: { schema: string; name: string };
  columns: DatabaseColumn[];
  indexes: DatabaseIndex[];
}

export interface DatabaseColumn {
  id: string;
  name: string;
  renameFrom?: string;
  type: string;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  default: string | null;
}

export interface DatabaseIndex {
  id: string;
  name: string;
  columns: string[];
  unique: boolean;
}

export interface CumulusDatabaseState {
  target: DatabaseTarget;
  schemas: DatabaseSchema[];
  tables: DatabaseTable[];
  fingerprint: string;
}

export interface DatabasePlanStep {
  stepId: string;
  op: DatabasePlanOperation;
  object: string;
  sql: string | null;
  risk: DatabaseRisk;
  details?: {
    table?: DatabaseTable;
    column?: DatabaseColumn;
    index?: DatabaseIndex;
  };
}

export interface DatabaseRisk {
  level: DatabaseRiskLevel;
  categories: string[];
  requiresApproval: boolean;
  snapshotRequired: boolean;
  reason: string;
}

export interface CumulusDatabasePlan {
  planId: string;
  planVersion: typeof CUMULUS_DB_PLAN_VERSION;
  manifestHash: string;
  irHash: string;
  target: DatabaseTarget;
  currentStateFingerprint: string;
  riskPolicyVersion: typeof CUMULUS_DB_RISK_POLICY_VERSION;
  steps: DatabasePlanStep[];
  summary: {
    creates: number;
    updates: number;
    drops: number;
    destructive: number;
    highestRisk: DatabaseRiskLevel;
    approvalRequired: boolean;
    snapshotRequired: boolean;
  };
  planHash: string;
}

export interface DatabaseApprovalRecord {
  approvalId: string;
  planId: string;
  planHash: string;
  decision: 'approved';
  approvedBy: {
    principalId: string;
    type: 'human' | 'agent' | 'system';
  };
  requiredScopes: string[];
  reason: string;
  expiresAt: string;
  createdAt: string;
}

export interface DatabaseSnapshot {
  snapshotId: string;
  target: DatabaseTarget;
  provider: 'postgres.logical_state.v0';
  reason: 'pre_destructive_apply' | 'manual' | 'revert_point';
  planId: string | null;
  createdAt: string;
  verified: boolean;
  stateFingerprint: string;
  state: CumulusDatabaseState;
}

export interface DatabaseAuditEvent {
  auditId: string;
  sequence: number;
  eventType: string;
  actor: {
    principalId: string;
    kind: 'human' | 'agent' | 'system';
  };
  target: DatabaseTarget;
  subject: Record<string, unknown>;
  decision?: Record<string, unknown>;
  timestamp: string;
  prevHash: string | null;
  eventHash: string;
}

export interface DatabaseApplyRun {
  applyRunId: string;
  planId: string;
  status: 'succeeded' | 'failed';
  snapshotId: string | null;
  startedAt: string;
  completedAt: string;
  executedSteps: Array<{
    stepId: string;
    status: 'succeeded' | 'failed';
    error?: string;
  }>;
  error?: {
    code: string;
    message: string;
  };
}

export interface DatabaseApplyResult {
  applyRun: DatabaseApplyRun;
  state: CumulusDatabaseState;
  snapshot: DatabaseSnapshot | null;
  audit: DatabaseAuditEvent[];
}

export interface DatabaseRestoreResult {
  snapshot: DatabaseSnapshot;
  currentState: CumulusDatabaseState;
  plan: CumulusDatabasePlan;
  approval: DatabaseApprovalRecord;
  apply: DatabaseApplyResult;
}

export interface PostgresQueryClient {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}

export function compileDatabaseManifest(manifest: NimbusDatabaseManifest): NimbusDatabaseIr {
  assertManifest(manifest);
  const schemas = normalizeSchemas(manifest);
  const tables = normalizeTables(manifest);
  const rawSql = [...(manifest.resources.rawSql ?? [])].map((item) => item.trim()).filter(Boolean).sort();
  const policies = {
    destructiveChanges: manifest.policies?.destructiveChanges ?? 'require_approval',
    snapshotBefore: manifest.policies?.snapshotBefore ?? ['destructive', 'irreversible', 'high'],
  };
  const manifestHash = stableHash(normalizeManifestForHash(manifest));
  const withoutHash: Omit<NimbusDatabaseIr, 'hash'> = {
    irVersion: NIMBUS_DB_IR_VERSION,
    manifestHash,
    metadata: manifest.metadata,
    target: normalizeTarget(manifest.target),
    resources: {
      schemas,
      tables,
      rawSql,
    },
    policies,
  };
  return {
    ...withoutHash,
    hash: stableHash(withoutHash),
  };
}

export function normalizeDatabaseState(input: Omit<CumulusDatabaseState, 'fingerprint'> & { fingerprint?: string }): CumulusDatabaseState {
  const normalized = {
    target: normalizeTarget(input.target),
    schemas: input.schemas
      .map((schema) => ({ id: `schema.${schema.name}`, name: schema.name }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    tables: input.tables.map(normalizeStateTable).sort(compareTable),
  };
  return {
    ...normalized,
    fingerprint: fingerprintDatabaseState(normalized),
  };
}

export function fingerprintDatabaseState(state: Omit<CumulusDatabaseState, 'fingerprint'>): string {
  return stableHash({
    target: normalizeTarget(state.target),
    schemas: state.schemas.map((schema) => ({ id: schema.id, name: schema.name })).sort((left, right) => left.name.localeCompare(right.name)),
    tables: state.tables.map(normalizeStateTable).sort(compareTable),
  });
}

export async function inspectPostgresDatabase(
  client: PostgresQueryClient,
  target: DatabaseTarget,
  options: { schemas?: string[] } = {},
): Promise<CumulusDatabaseState> {
  const requestedSchemas = [...new Set((options.schemas ?? ['public']).filter(Boolean))].sort();
  const schemaRows = await client.query<{ schema_name: string }>(
    'select schema_name from information_schema.schemata where schema_name = any($1::text[]) order by schema_name',
    [requestedSchemas],
  );
  const tableRows = await client.query<{
    table_schema: string;
    table_name: string;
  }>(
    `select table_schema, table_name
       from information_schema.tables
      where table_type = 'BASE TABLE'
        and table_schema = any($1::text[])
      order by table_schema, table_name`,
    [requestedSchemas],
  );
  const columnRows = await client.query<{
    table_schema: string;
    table_name: string;
    column_name: string;
    data_type: string;
    udt_name: string;
    is_nullable: string;
    column_default: string | null;
    ordinal_position: number;
  }>(
    `select table_schema, table_name, column_name, data_type, udt_name, is_nullable, column_default, ordinal_position
       from information_schema.columns
      where table_schema = any($1::text[])
      order by table_schema, table_name, ordinal_position`,
    [requestedSchemas],
  );
  const constraintRows = await client.query<{
    table_schema: string;
    table_name: string;
    column_name: string;
    constraint_type: string;
    constraint_name: string;
  }>(
    `select tc.table_schema, tc.table_name, kcu.column_name, tc.constraint_type, tc.constraint_name
       from information_schema.table_constraints tc
       join information_schema.key_column_usage kcu
         on kcu.constraint_schema = tc.constraint_schema
        and kcu.constraint_name = tc.constraint_name
        and kcu.table_schema = tc.table_schema
        and kcu.table_name = tc.table_name
      where tc.table_schema = any($1::text[])
        and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE')
      order by tc.table_schema, tc.table_name, tc.constraint_name, kcu.ordinal_position`,
    [requestedSchemas],
  );
  const indexRows = await client.query<{
    table_schema: string;
    table_name: string;
    index_name: string;
    is_unique: boolean;
    column_names: string[];
  }>(
    `select ns.nspname as table_schema,
            tbl.relname as table_name,
            idx.relname as index_name,
            ix.indisunique as is_unique,
            to_json(array_agg(att.attname order by ord.ordinality)) as column_names
       from pg_class tbl
       join pg_namespace ns on ns.oid = tbl.relnamespace
       join pg_index ix on ix.indrelid = tbl.oid
       join pg_class idx on idx.oid = ix.indexrelid
       left join pg_constraint con on con.conindid = idx.oid
       join unnest(ix.indkey) with ordinality as ord(attnum, ordinality) on ord.attnum <> 0
       join pg_attribute att on att.attrelid = tbl.oid and att.attnum = ord.attnum
      where ns.nspname = any($1::text[])
        and tbl.relkind = 'r'
        and con.oid is null
      group by ns.nspname, tbl.relname, idx.relname, ix.indisunique
      order by ns.nspname, tbl.relname, idx.relname`,
    [requestedSchemas],
  );
  const constraintsByColumn = new Map<string, { primaryKey: boolean; unique: boolean }>();
  const uniqueConstraintColumns = new Map<string, { tableSchema: string; tableName: string; columns: string[] }>();
  for (const row of constraintRows.rows) {
    const key = `${row.table_schema}.${row.table_name}.${row.column_name}`;
    const current = constraintsByColumn.get(key) ?? { primaryKey: false, unique: false };
    if (row.constraint_type === 'PRIMARY KEY') current.primaryKey = true;
    if (row.constraint_type === 'UNIQUE') {
      const constraintKey = `${row.table_schema}.${row.table_name}.${row.constraint_name}`;
      const entry = uniqueConstraintColumns.get(constraintKey) ?? {
        tableSchema: row.table_schema,
        tableName: row.table_name,
        columns: [],
      };
      entry.columns.push(row.column_name);
      uniqueConstraintColumns.set(constraintKey, entry);
    }
    constraintsByColumn.set(key, current);
  }
  for (const entry of uniqueConstraintColumns.values()) {
    if (entry.columns.length !== 1) continue;
    const key = `${entry.tableSchema}.${entry.tableName}.${entry.columns[0]}`;
    const current = constraintsByColumn.get(key) ?? { primaryKey: false, unique: false };
    current.unique = true;
    constraintsByColumn.set(key, current);
  }

  const columnsByTable = new Map<string, DatabaseColumn[]>();
  for (const row of columnRows.rows) {
    const tableKey = `${row.table_schema}.${row.table_name}`;
    const columnKey = `${tableKey}.${row.column_name}`;
    const constraints = constraintsByColumn.get(columnKey) ?? { primaryKey: false, unique: false };
    const columns = columnsByTable.get(tableKey) ?? [];
    columns.push({
      id: `column.${tableKey}.${row.column_name}`,
      name: row.column_name,
      type: normalizePostgresType(row.data_type, row.udt_name),
      nullable: row.is_nullable === 'YES',
      primaryKey: constraints.primaryKey,
      unique: constraints.unique,
      default: row.column_default,
    });
    columnsByTable.set(tableKey, columns);
  }

  const indexesByTable = new Map<string, DatabaseIndex[]>();
  for (const row of indexRows.rows) {
    const tableKey = `${row.table_schema}.${row.table_name}`;
    const indexes = indexesByTable.get(tableKey) ?? [];
    indexes.push({
      id: `index.${tableKey}.${row.index_name}`,
      name: row.index_name,
      columns: [...row.column_names],
      unique: row.is_unique,
    });
    indexesByTable.set(tableKey, indexes);
  }

  return normalizeDatabaseState({
    target,
    schemas: schemaRows.rows.map((row) => ({ id: `schema.${row.schema_name}`, name: row.schema_name })),
    tables: tableRows.rows.map((row) => ({
      id: `table.${row.table_schema}.${row.table_name}`,
      schema: row.table_schema,
      name: row.table_name,
      columns: columnsByTable.get(`${row.table_schema}.${row.table_name}`) ?? [],
      indexes: indexesByTable.get(`${row.table_schema}.${row.table_name}`) ?? [],
    })),
  });
}

export function createDatabasePlan(input: {
  ir: NimbusDatabaseIr;
  currentState: CumulusDatabaseState;
  now?: string;
}): CumulusDatabasePlan {
  const currentState = normalizeDatabaseState(input.currentState);
  const steps = diffDatabaseState(input.ir, currentState);
  const highestRisk = maxDatabaseRisk(steps.map((step) => step.risk.level));
  const summary = {
    creates: steps.filter((step) => step.op === 'create_schema' || step.op === 'create_table' || step.op === 'add_column' || step.op === 'add_index' || step.op === 'add_unique_constraint').length,
    updates: steps.filter((step) => step.op === 'alter_column_nullable' || step.op === 'alter_column_type' || step.op === 'rename_column' || step.op === 'rename_table').length,
    drops: steps.filter((step) => step.op === 'drop_column' || step.op === 'drop_table' || step.op === 'drop_index').length,
    destructive: steps.filter((step) => riskRank(step.risk.level) >= riskRank('R5_DESTRUCTIVE')).length,
    highestRisk,
    approvalRequired: steps.some((step) => step.risk.requiresApproval),
    snapshotRequired: steps.some((step) => step.risk.snapshotRequired),
  };
  const planWithoutHash: Omit<CumulusDatabasePlan, 'planHash'> = {
    planId: `plan_${randomUUID().replace(/-/g, '')}`,
    planVersion: CUMULUS_DB_PLAN_VERSION,
    manifestHash: input.ir.manifestHash,
    irHash: input.ir.hash,
    target: input.ir.target,
    currentStateFingerprint: currentState.fingerprint,
    riskPolicyVersion: CUMULUS_DB_RISK_POLICY_VERSION,
    steps,
    summary,
  };
  return {
    ...planWithoutHash,
    planHash: stableHash({
      planVersion: planWithoutHash.planVersion,
      manifestHash: planWithoutHash.manifestHash,
      irHash: planWithoutHash.irHash,
      target: planWithoutHash.target,
      currentStateFingerprint: planWithoutHash.currentStateFingerprint,
      riskPolicyVersion: planWithoutHash.riskPolicyVersion,
      steps: planWithoutHash.steps,
      summary: planWithoutHash.summary,
    }),
  };
}

export function createDatabaseRestorePlan(input: {
  snapshot: DatabaseSnapshot;
  currentState: CumulusDatabaseState;
  now?: string;
}): CumulusDatabasePlan {
  const restoredState = restoreDatabaseSnapshot(input.snapshot);
  return createDatabasePlan({
    ir: databaseStateToIr(restoredState, {
      name: `restore-${input.snapshot.snapshotId}`,
      manifestHash: stableHash({
        kind: 'database_snapshot_restore',
        snapshotId: input.snapshot.snapshotId,
        stateFingerprint: input.snapshot.stateFingerprint,
      }),
    }),
    currentState: input.currentState,
    now: input.now,
  });
}

export function createDatabaseApproval(
  plan: CumulusDatabasePlan,
  input: {
    principalId: string;
    type?: 'human' | 'agent' | 'system';
    scopes?: string[];
    reason: string;
    now?: string;
    expiresAt?: string;
  },
): DatabaseApprovalRecord {
  const requiredScopes = requiredApprovalScopes(plan);
  const granted = new Set(input.scopes ?? requiredScopes);
  const missing = requiredScopes.filter((scope) => !granted.has(scope));
  if (missing.length) throw new Error(`APPROVAL_SCOPE_MISSING: ${missing.join(', ')}`);
  const createdAt = input.now ?? nowIso();
  return {
    approvalId: `appr_${randomUUID().replace(/-/g, '')}`,
    planId: plan.planId,
    planHash: plan.planHash,
    decision: 'approved',
    approvedBy: {
      principalId: input.principalId,
      type: input.type ?? 'human',
    },
    requiredScopes,
    reason: input.reason,
    expiresAt: input.expiresAt ?? new Date(Date.parse(createdAt) + 5 * 60 * 1000).toISOString(),
    createdAt,
  };
}

export function executeDatabasePlan(input: {
  plan: CumulusDatabasePlan;
  currentState: CumulusDatabaseState;
  approval?: DatabaseApprovalRecord;
  actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
  now?: string;
  snapshotReason?: DatabaseSnapshot['reason'];
  initialAudit?: DatabaseAuditEvent[];
}): DatabaseApplyResult {
  const startedAt = input.now ?? nowIso();
  const audit: DatabaseAuditEvent[] = [...(input.initialAudit ?? [])];
  const actor = input.actor ?? { principalId: 'system', kind: 'system' };
  appendDatabaseAuditEvent(audit, {
    eventType: 'apply.started',
    actor,
    target: input.plan.target,
    subject: { planId: input.plan.planId, planHash: input.plan.planHash },
    decision: {
      riskLevel: input.plan.summary.highestRisk,
      approvalRequired: input.plan.summary.approvalRequired,
    },
    timestamp: startedAt,
  });
  assertPlanCanApply(input.plan, input.currentState, input.approval, startedAt);

  const snapshot = input.plan.summary.snapshotRequired
    ? createDatabaseSnapshot(input.currentState, {
        reason: input.snapshotReason ?? 'pre_destructive_apply',
        planId: input.plan.planId,
        createdAt: startedAt,
      })
    : null;
  if (snapshot) {
    appendDatabaseAuditEvent(audit, {
      eventType: 'snapshot.created',
      actor,
      target: input.plan.target,
      subject: { planId: input.plan.planId, snapshotId: snapshot.snapshotId },
      timestamp: snapshot.createdAt,
    });
  }

  let nextState = cloneState(input.currentState);
  const executedSteps: DatabaseApplyRun['executedSteps'] = [];
  for (const step of input.plan.steps) {
    appendDatabaseAuditEvent(audit, {
      eventType: 'apply.step.started',
      actor,
      target: input.plan.target,
      subject: { planId: input.plan.planId, stepId: step.stepId, op: step.op, object: step.object },
      timestamp: nowIso(),
    });
    nextState = applyStep(nextState, step);
    executedSteps.push({ stepId: step.stepId, status: 'succeeded' });
    appendDatabaseAuditEvent(audit, {
      eventType: 'apply.step.completed',
      actor,
      target: input.plan.target,
      subject: { planId: input.plan.planId, stepId: step.stepId, op: step.op, object: step.object },
      timestamp: nowIso(),
    });
  }
  const completedAt = nowIso();
  appendDatabaseAuditEvent(audit, {
    eventType: 'apply.completed',
    actor,
    target: input.plan.target,
    subject: {
      planId: input.plan.planId,
      planHash: input.plan.planHash,
      finalStateFingerprint: nextState.fingerprint,
    },
    timestamp: completedAt,
  });
  return {
    applyRun: {
      applyRunId: `apply_${randomUUID().replace(/-/g, '')}`,
      planId: input.plan.planId,
      status: 'succeeded',
      snapshotId: snapshot?.snapshotId ?? null,
      startedAt,
      completedAt,
      executedSteps,
    },
    state: nextState,
    snapshot,
    audit,
  };
}

export function createDatabaseApplyFailure(input: {
  plan: CumulusDatabasePlan;
  currentState: CumulusDatabaseState;
  error: unknown;
  actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
  now?: string;
  initialAudit?: DatabaseAuditEvent[];
}): DatabaseApplyResult {
  const startedAt = input.now ?? nowIso();
  const completedAt = nowIso();
  const actor = input.actor ?? { principalId: 'system', kind: 'system' };
  const error = databaseError(input.error);
  const audit: DatabaseAuditEvent[] = [...(input.initialAudit ?? [])];
  appendDatabaseAuditEvent(audit, {
    eventType: 'apply.started',
    actor,
    target: input.plan.target,
    subject: { planId: input.plan.planId, planHash: input.plan.planHash },
    decision: {
      riskLevel: input.plan.summary.highestRisk,
      approvalRequired: input.plan.summary.approvalRequired,
    },
    timestamp: startedAt,
  });
  appendDatabaseAuditEvent(audit, {
    eventType: 'apply.failed',
    actor,
    target: input.plan.target,
    subject: {
      planId: input.plan.planId,
      planHash: input.plan.planHash,
      currentStateFingerprint: input.currentState.fingerprint,
    },
    decision: {
      errorCode: error.code,
      errorMessage: error.message,
    },
    timestamp: completedAt,
  });
  return {
    applyRun: {
      applyRunId: `apply_${randomUUID().replace(/-/g, '')}`,
      planId: input.plan.planId,
      status: 'failed',
      snapshotId: null,
      startedAt,
      completedAt,
      executedSteps: [],
      error,
    },
    state: normalizeDatabaseState(input.currentState),
    snapshot: null,
    audit,
  };
}

export function assertPlanCanApply(
  plan: CumulusDatabasePlan,
  currentState: CumulusDatabaseState,
  approval?: DatabaseApprovalRecord,
  now = nowIso(),
): void {
  if (currentState.fingerprint !== plan.currentStateFingerprint) {
    throw new Error('STATE_DRIFTED: current database state changed after planning');
  }
  if (!plan.summary.approvalRequired) return;
  if (!approval) throw new Error('APPROVAL_REQUIRED: this plan requires approval');
  if (approval.planHash !== plan.planHash) {
    throw new Error('APPROVAL_PLAN_HASH_MISMATCH: approval is not bound to this plan');
  }
  if (approval.planId !== plan.planId) {
    throw new Error('APPROVAL_PLAN_ID_MISMATCH: approval is not bound to this plan id');
  }
  if (Date.parse(approval.expiresAt) <= Date.parse(now)) {
    throw new Error('APPROVAL_EXPIRED: approval expired before apply');
  }
  const required = requiredApprovalScopes(plan);
  const approved = new Set(approval.requiredScopes);
  const missing = required.filter((scope) => !approved.has(scope));
  if (missing.length) {
    throw new Error(`APPROVAL_SCOPE_MISSING: ${missing.join(', ')}`);
  }
}

export function createDatabaseSnapshot(
  state: CumulusDatabaseState,
  input: {
    reason: DatabaseSnapshot['reason'];
    planId?: string | null;
    createdAt?: string;
  },
): DatabaseSnapshot {
  const normalized = normalizeDatabaseState(state);
  return {
    snapshotId: `snap_${randomUUID().replace(/-/g, '')}`,
    target: normalized.target,
    provider: 'postgres.logical_state.v0',
    reason: input.reason,
    planId: input.planId ?? null,
    createdAt: input.createdAt ?? nowIso(),
    verified: true,
    stateFingerprint: normalized.fingerprint,
    state: normalized,
  };
}

export function restoreDatabaseSnapshot(snapshot: DatabaseSnapshot): CumulusDatabaseState {
  if (!snapshot.verified) throw new Error('SNAPSHOT_NOT_VERIFIED: snapshot cannot be restored');
  return cloneState(snapshot.state);
}

export function databaseStateToIr(
  state: CumulusDatabaseState,
  input: {
    name?: string;
    workspace?: string;
    manifestHash?: string;
    policies?: Required<NonNullable<NimbusDatabaseManifest['policies']>>;
  } = {},
): NimbusDatabaseIr {
  const normalized = normalizeDatabaseState(state);
  const manifestHash = input.manifestHash ?? stableHash({
    kind: 'database_state_manifest',
    stateFingerprint: normalized.fingerprint,
  });
  const policies = input.policies ?? {
    destructiveChanges: 'require_approval' as const,
    snapshotBefore: ['destructive', 'irreversible', 'high'] as Array<'destructive' | 'irreversible' | 'high'>,
  };
  const withoutHash: Omit<NimbusDatabaseIr, 'hash'> = {
    irVersion: NIMBUS_DB_IR_VERSION,
    manifestHash,
    metadata: {
      name: input.name ?? `state-${normalized.fingerprint.slice('sha256:'.length, 'sha256:'.length + 12)}`,
      ...(input.workspace ? { workspace: input.workspace } : {}),
    },
    target: normalized.target,
    resources: {
      schemas: normalized.schemas.map((schema) => ({ ...schema })),
      tables: normalized.tables.map((table) => ({
        id: table.id,
        schema: table.schema,
        name: table.name,
        columns: table.columns.map((column) => ({ ...column })),
        indexes: table.indexes.map((index) => ({ ...index, columns: [...index.columns] })),
      })),
      rawSql: [],
    },
    policies,
  };
  return {
    ...withoutHash,
    hash: stableHash(withoutHash),
  };
}

export function appendDatabaseAuditEvent(
  chain: DatabaseAuditEvent[],
  input: Omit<DatabaseAuditEvent, 'auditId' | 'sequence' | 'prevHash' | 'eventHash'>,
): DatabaseAuditEvent {
  const prevHash = chain.at(-1)?.eventHash ?? null;
  const withoutHash = {
    auditId: `aud_${randomUUID().replace(/-/g, '')}`,
    sequence: chain.length + 1,
    ...input,
    prevHash,
  };
  const event = {
    ...withoutHash,
    eventHash: stableHash(withoutHash),
  };
  chain.push(event);
  return event;
}

export function verifyDatabaseAuditChain(chain: DatabaseAuditEvent[]): boolean {
  return chain.every((event, index) => {
    const { eventHash, ...withoutHash } = event;
    const expectedPrevHash = index === 0 ? null : chain[index - 1]?.eventHash;
    return event.prevHash === expectedPrevHash && eventHash === stableHash(withoutHash);
  });
}

function assertManifest(manifest: NimbusDatabaseManifest): void {
  if (manifest.apiVersion !== NIMBUS_DB_API_VERSION) throw new Error(`expected apiVersion ${NIMBUS_DB_API_VERSION}`);
  if (manifest.kind !== NIMBUS_DB_KIND) throw new Error(`expected kind ${NIMBUS_DB_KIND}`);
  if (!manifest.metadata?.name) throw new Error('manifest metadata.name is required');
  if (manifest.target?.engine !== 'postgres') throw new Error('only postgres database targets are supported');
  if (!manifest.target.database) throw new Error('manifest target.database is required');
  for (const table of manifest.resources?.tables ?? []) {
    if (!table.name) throw new Error('table name is required');
    if (typeof table.renameFrom === 'object' && !table.renameFrom.name) throw new Error(`table ${table.name} has an invalid renameFrom`);
    if (!table.columns?.length) throw new Error(`table ${table.name} requires columns`);
    for (const column of table.columns) {
      if (!column.name || !column.type) throw new Error(`table ${table.name} has an invalid column`);
      if (column.renameFrom !== undefined && !column.renameFrom.trim()) throw new Error(`table ${table.name} has an invalid column renameFrom`);
    }
  }
}

function normalizeManifestForHash(manifest: NimbusDatabaseManifest): NimbusDatabaseManifest {
  return {
    apiVersion: manifest.apiVersion,
    kind: manifest.kind,
    metadata: manifest.metadata,
    target: normalizeTarget(manifest.target),
    resources: {
      schemas: normalizeSchemas(manifest).map(({ name }) => ({ name })),
      tables: normalizeTables(manifest).map((table) => ({
        schema: table.schema,
        name: table.name,
        ...(table.renameFrom ? { renameFrom: table.renameFrom } : {}),
        columns: table.columns.map((column) => ({
          name: column.name,
          ...(column.renameFrom ? { renameFrom: column.renameFrom } : {}),
          type: column.type,
          nullable: column.nullable,
          primaryKey: column.primaryKey,
          unique: column.unique,
          ...(column.default !== null ? { default: column.default } : {}),
        })),
        indexes: table.indexes.map((index) => ({
          name: index.name,
          columns: index.columns,
          unique: index.unique,
        })),
      })),
      rawSql: [...(manifest.resources.rawSql ?? [])].map((item) => item.trim()).filter(Boolean).sort(),
    },
    policies: {
      destructiveChanges: manifest.policies?.destructiveChanges ?? 'require_approval',
      snapshotBefore: manifest.policies?.snapshotBefore ?? ['destructive', 'irreversible', 'high'],
    },
  };
}

function normalizeTarget(target: DatabaseTarget): DatabaseTarget {
  return {
    engine: target.engine,
    database: target.database,
    ...(target.environment ? { environment: target.environment } : {}),
  };
}

function normalizeSchemas(manifest: NimbusDatabaseManifest): DatabaseSchema[] {
  const names = new Set<string>((manifest.resources.schemas ?? []).map((schema) => schema.name));
  for (const table of manifest.resources.tables ?? []) names.add(table.schema ?? 'public');
  if (!names.size) names.add('public');
  return [...names]
    .filter(Boolean)
    .sort()
    .map((name) => ({ id: `schema.${name}`, name }));
}

function normalizeTables(manifest: NimbusDatabaseManifest): DatabaseTable[] {
  return [...(manifest.resources.tables ?? [])]
    .map((table) => {
      const schema = table.schema ?? 'public';
      const tableId = `table.${schema}.${table.name}`;
      return {
        id: tableId,
        schema,
        name: table.name,
        ...(table.renameFrom ? { renameFrom: normalizeTableRename(schema, table.renameFrom) } : {}),
        columns: table.columns
          .map((column) => normalizeColumn(schema, table.name, column))
          .sort((left, right) => left.name.localeCompare(right.name)),
        indexes: (table.indexes ?? [])
          .map((index, indexPosition) => normalizeIndex(schema, table.name, index, indexPosition))
          .sort((left, right) => left.name.localeCompare(right.name)),
      };
    })
    .sort(compareTable);
}

function normalizeColumn(schema: string, table: string, column: DatabaseColumnInput): DatabaseColumn {
  const primaryKey = column.primaryKey === true;
  return {
    id: `column.${schema}.${table}.${column.name}`,
    name: column.name,
    ...(column.renameFrom ? { renameFrom: column.renameFrom } : {}),
    type: column.type,
    nullable: primaryKey ? false : column.nullable ?? true,
    primaryKey,
    unique: column.unique === true,
    default: column.default ?? null,
  };
}

function normalizeTableRename(schema: string, renameFrom: DatabaseTableInput['renameFrom']): { schema: string; name: string } {
  if (typeof renameFrom === 'string') return { schema, name: renameFrom };
  return { schema: renameFrom?.schema ?? schema, name: renameFrom?.name ?? '' };
}

function normalizeIndex(schema: string, table: string, index: DatabaseIndexInput, indexPosition: number): DatabaseIndex {
  const name = index.name ?? `${table}_${index.columns.join('_')}_${indexPosition}_idx`;
  return {
    id: `index.${schema}.${table}.${name}`,
    name,
    columns: [...index.columns],
    unique: index.unique === true,
  };
}

function normalizeStateTable(table: DatabaseTable): DatabaseTable {
  return {
    id: `table.${table.schema}.${table.name}`,
    schema: table.schema,
    name: table.name,
    columns: table.columns
      .map((column) => ({
        id: `column.${table.schema}.${table.name}.${column.name}`,
        name: column.name,
        type: column.type,
        nullable: column.primaryKey ? false : column.nullable,
        primaryKey: column.primaryKey,
        unique: column.unique,
        default: column.default,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    indexes: table.indexes
      .map((index) => ({
        id: `index.${table.schema}.${table.name}.${index.name}`,
        name: index.name,
        columns: [...index.columns],
        unique: index.unique,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  };
}

function diffDatabaseState(ir: NimbusDatabaseIr, currentState: CumulusDatabaseState): DatabasePlanStep[] {
  const steps: DatabasePlanStep[] = [];
  const currentSchemas = new Set(currentState.schemas.map((schema) => schema.name));
  for (const schema of ir.resources.schemas) {
    if (!currentSchemas.has(schema.name)) {
      steps.push(step(steps.length, 'create_schema', schema.name, `create schema if not exists ${quoteIdent(schema.name)};`, ir));
    }
  }

  const desiredTables = new Map(ir.resources.tables.map((table) => [tableKey(table), table]));
  const currentTables = new Map(currentState.tables.map((table) => [tableKey(table), table]));
  const consumedCurrentTables = new Set<string>();

  for (const [key, desired] of desiredTables) {
    let current = currentTables.get(key);
    if (!current && desired.renameFrom) {
      const renameFromKey = `${desired.renameFrom.schema}.${desired.renameFrom.name}`;
      const renameSource = currentTables.get(renameFromKey);
      if (renameSource) {
        consumedCurrentTables.add(renameFromKey);
        steps.push(step(steps.length, 'rename_table', renameFromKey, renameTableSql(desired.renameFrom, desired), ir, { table: desired }));
        current = { ...renameSource, schema: desired.schema, name: desired.name };
      }
    }
    if (!current) {
      steps.push(step(steps.length, 'create_table', key, createTableSql(desired), ir, { table: { ...desired, indexes: [] } }));
      for (const desiredIndex of desired.indexes) {
        steps.push(addIndexStep(steps.length, desired, desiredIndex, ir));
      }
      continue;
    }
    diffDroppedIndexes(steps, current, desired, ir);
    diffColumns(steps, current, desired, ir);
    diffAddedIndexes(steps, current, desired, ir);
  }

  for (const [key] of currentTables) {
    if (!desiredTables.has(key) && !consumedCurrentTables.has(key)) {
      steps.push(step(steps.length, 'drop_table', key, `drop table ${quoteQualified(key)};`, ir));
    }
  }

  for (const sql of ir.resources.rawSql) {
      steps.push(step(steps.length, 'raw_sql_blocked_by_default', 'raw_sql', sql, ir));
  }

  return steps.length
    ? steps
    : [
        {
          stepId: 'step_001',
          op: 'noop',
          object: ir.target.database,
          sql: null,
          risk: classifyDatabaseOperation('noop', ir),
        },
      ];
}

function diffColumns(steps: DatabasePlanStep[], current: DatabaseTable, desired: DatabaseTable, ir: NimbusDatabaseIr): void {
  const currentColumns = new Map(current.columns.map((column) => [column.name, column]));
  const desiredColumns = new Map(desired.columns.map((column) => [column.name, column]));
  const consumedCurrentColumns = new Set<string>();
  for (const [name, desiredColumn] of desiredColumns) {
    let currentColumn = currentColumns.get(name);
    const object = `${desired.schema}.${desired.name}.${name}`;
    if (!currentColumn && desiredColumn.renameFrom) {
      const renameSource = currentColumns.get(desiredColumn.renameFrom);
      if (renameSource) {
        consumedCurrentColumns.add(desiredColumn.renameFrom);
        steps.push(
          step(
            steps.length,
            'rename_column',
            `${desired.schema}.${desired.name}.${desiredColumn.renameFrom}`,
            `alter table ${quoteTable(desired)} rename column ${quoteIdent(desiredColumn.renameFrom)} to ${quoteIdent(name)};`,
            ir,
            { column: desiredColumn },
          ),
        );
        currentColumn = { ...renameSource, name: desiredColumn.name };
      }
    }
    if (!currentColumn) {
      steps.push(
        step(steps.length, 'add_column', object, `alter table ${quoteTable(desired)} add column ${columnSql(desiredColumn, { includeUnique: false })};`, ir, {
          column: desiredColumn,
        }),
      );
      if (desiredColumn.unique) {
        steps.push(step(steps.length, 'add_unique_constraint', object, addUniqueSql(desired, desiredColumn), ir, { column: desiredColumn }));
      }
      continue;
    }
    if (currentColumn.type !== desiredColumn.type) {
      steps.push(
        step(
          steps.length,
          'alter_column_type',
          object,
          `alter table ${quoteTable(desired)} alter column ${quoteIdent(name)} type ${desiredColumn.type};`,
          ir,
          { column: desiredColumn },
        ),
      );
    }
    if (currentColumn.nullable !== desiredColumn.nullable) {
      const nullSql = desiredColumn.nullable ? 'drop not null' : 'set not null';
      steps.push(
        step(
          steps.length,
          'alter_column_nullable',
          object,
          `alter table ${quoteTable(desired)} alter column ${quoteIdent(name)} ${nullSql};`,
          ir,
          { column: desiredColumn },
        ),
      );
    }
    if (!currentColumn.unique && desiredColumn.unique) {
      steps.push(step(steps.length, 'add_unique_constraint', object, addUniqueSql(desired, desiredColumn), ir, { column: desiredColumn }));
    }
  }
  for (const [name] of currentColumns) {
    if (!desiredColumns.has(name) && !consumedCurrentColumns.has(name)) {
      const object = `${desired.schema}.${desired.name}.${name}`;
      steps.push(step(steps.length, 'drop_column', object, `alter table ${quoteTable(desired)} drop column ${quoteIdent(name)};`, ir));
    }
  }
}

function diffDroppedIndexes(steps: DatabasePlanStep[], current: DatabaseTable, desired: DatabaseTable, ir: NimbusDatabaseIr): void {
  const currentIndexes = new Map(current.indexes.map((index) => [index.name, index]));
  const desiredIndexes = new Map(desired.indexes.map((index) => [index.name, index]));
  for (const [name] of currentIndexes) {
    if (!desiredIndexes.has(name)) {
      steps.push(step(steps.length, 'drop_index', `${desired.schema}.${desired.name}.${name}`, `drop index ${quoteIdent(desired.schema)}.${quoteIdent(name)};`, ir));
    }
  }
}

function diffAddedIndexes(steps: DatabasePlanStep[], current: DatabaseTable, desired: DatabaseTable, ir: NimbusDatabaseIr): void {
  const currentIndexes = new Map(current.indexes.map((index) => [index.name, index]));
  const desiredIndexes = new Map(desired.indexes.map((index) => [index.name, index]));
  for (const [name, desiredIndex] of desiredIndexes) {
    const currentIndex = currentIndexes.get(name);
    if (!currentIndex) {
      steps.push(addIndexStep(steps.length, desired, desiredIndex, ir));
    }
  }
}

function addIndexStep(index: number, table: DatabaseTable, desiredIndex: DatabaseIndex, ir: NimbusDatabaseIr): DatabasePlanStep {
  const unique = desiredIndex.unique ? 'unique ' : '';
  return step(
    index,
    desiredIndex.unique ? 'add_unique_constraint' : 'add_index',
    `${table.schema}.${table.name}.${desiredIndex.name}`,
    `create ${unique}index ${quoteIdent(desiredIndex.name)} on ${quoteTable(table)} (${desiredIndex.columns.map(quoteIdent).join(', ')});`,
    ir,
    { index: desiredIndex },
  );
}

function step(
  index: number,
  op: DatabasePlanOperation,
  object: string,
  sql: string | null,
  ir: NimbusDatabaseIr,
  details: DatabasePlanStep['details'] = {},
): DatabasePlanStep {
  return {
    stepId: `step_${String(index + 1).padStart(3, '0')}`,
    op,
    object,
    sql,
    risk: classifyDatabaseOperation(op, ir, details.column),
    ...(details.table || details.column || details.index ? { details } : {}),
  };
}

function classifyDatabaseOperation(op: DatabasePlanOperation, ir: NimbusDatabaseIr, column?: DatabaseColumn): DatabaseRisk {
  if (op === 'noop') return risk('R0_NOOP', ['noop'], false, false, 'No changes.');
  if (op === 'create_schema' || op === 'create_table' || op === 'add_index') {
    return risk('R1_SAFE_ADDITIVE', ['additive'], false, false, 'Adds database structure without removing data.');
  }
  if (op === 'add_column') {
    if (column && !column.nullable && column.default === null) {
      return risk('R3_DATA_DEPENDENT', ['data_dependent'], true, needsSnapshot('high', ir), 'Adding a NOT NULL column without a default can fail on existing rows.');
    }
    return risk('R1_SAFE_ADDITIVE', ['additive'], false, false, 'Adds a nullable or defaulted column.');
  }
  if (op === 'alter_column_nullable') {
    return risk('R3_DATA_DEPENDENT', ['data_dependent'], true, needsSnapshot('high', ir), 'Changing nullability depends on existing data.');
  }
  if (op === 'alter_column_type' || op === 'add_unique_constraint') {
    return risk('R3_DATA_DEPENDENT', ['data_dependent'], true, needsSnapshot('high', ir), 'The change may fail or rewrite data depending on existing rows.');
  }
  if (op === 'rename_column' || op === 'rename_table') {
    return risk('R4_BACKWARD_INCOMPATIBLE', ['backward_incompatible'], true, needsSnapshot('high', ir), 'Renames can break existing queries.');
  }
  if (op === 'drop_column' || op === 'drop_table') {
    return risk('R5_DESTRUCTIVE', ['destructive'], true, needsSnapshot('destructive', ir), 'The change removes data or access to data.');
  }
  if (op === 'drop_index') {
    return risk('R2_OPERATIONAL', ['operational'], ir.target.environment === 'prod', false, 'Dropping an index can affect query performance.');
  }
  return risk('R6_IRREVERSIBLE_OR_UNKNOWN', ['unknown'], true, needsSnapshot('irreversible', ir), 'Raw SQL or unsupported operations are blocked until explicitly approved.');
}

function risk(
  level: DatabaseRiskLevel,
  categories: string[],
  requiresApproval: boolean,
  snapshotRequired: boolean,
  reason: string,
): DatabaseRisk {
  return { level, categories, requiresApproval, snapshotRequired, reason };
}

function needsSnapshot(kind: 'destructive' | 'irreversible' | 'high', ir: NimbusDatabaseIr): boolean {
  return ir.policies.snapshotBefore.includes(kind);
}

function databaseError(error: unknown): { code: string; message: string } {
  const message = error instanceof Error ? error.message : String(error);
  const codeMatch = message.match(/^([A-Z][A-Z0-9_]+):/);
  return {
    code: codeMatch?.[1] ?? 'APPLY_FAILED',
    message,
  };
}

function requiredApprovalScopes(plan: CumulusDatabasePlan): string[] {
  if (!plan.summary.approvalRequired) return [];
  const scopes = ['cumulus.plan.read', 'cumulus.apply'];
  if (riskRank(plan.summary.highestRisk) >= riskRank('R5_DESTRUCTIVE')) scopes.push('cumulus.approve.destructive');
  if (plan.summary.highestRisk === 'R6_IRREVERSIBLE_OR_UNKNOWN') scopes.push('cumulus.approve.admin_override');
  return scopes;
}

function applyStep(state: CumulusDatabaseState, planStep: DatabasePlanStep): CumulusDatabaseState {
  if (planStep.op === 'noop') return state;
  const next = cloneState(state);
  const [schema, table, columnOrIndex] = planStep.object.split('.');
  if (!schema) return next;
  if (planStep.op === 'create_schema' && !next.schemas.some((item) => item.name === planStep.object)) {
    next.schemas.push({ id: `schema.${planStep.object}`, name: planStep.object });
    return normalizeDatabaseState(next);
  }
  if (!table) return next;
  if (planStep.op === 'drop_table') {
    next.tables = next.tables.filter((item) => tableKey(item) !== planStep.object);
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'create_table' && planStep.details?.table) {
    next.tables.push(planStep.details.table);
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'rename_table' && planStep.details?.table) {
    const oldTable = next.tables.find((item) => item.schema === schema && item.name === table);
    if (oldTable) {
      oldTable.schema = planStep.details.table.schema;
      oldTable.name = planStep.details.table.name;
    }
    return normalizeDatabaseState(next);
  }
  const targetTable = next.tables.find((item) => item.schema === schema && item.name === table);
  if (!targetTable) return next;
  if (planStep.op === 'rename_column' && columnOrIndex && planStep.details?.column) {
    const column = targetTable.columns.find((item) => item.name === columnOrIndex);
    if (column) {
      column.name = planStep.details.column.name;
      for (const index of targetTable.indexes) {
        index.columns = index.columns.map((name) => name === columnOrIndex ? planStep.details!.column!.name : name);
      }
    }
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'drop_column' && columnOrIndex) {
    targetTable.columns = targetTable.columns.filter((column) => column.name !== columnOrIndex);
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'add_column' && planStep.details?.column) {
    targetTable.columns.push(planStep.details.column);
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'add_unique_constraint' && columnOrIndex) {
    const column = targetTable.columns.find((item) => item.name === columnOrIndex);
    if (column) {
      column.unique = true;
      return normalizeDatabaseState(next);
    }
    if (planStep.details?.index) {
      targetTable.indexes.push(planStep.details.index);
      return normalizeDatabaseState(next);
    }
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'alter_column_type' && columnOrIndex && planStep.details?.column) {
    const column = targetTable.columns.find((item) => item.name === columnOrIndex);
    if (column) column.type = planStep.details.column.type;
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'alter_column_nullable' && columnOrIndex && planStep.details?.column) {
    const column = targetTable.columns.find((item) => item.name === columnOrIndex);
    if (column) column.nullable = planStep.details.column.nullable;
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'add_index' && planStep.details?.index) {
    targetTable.indexes.push(planStep.details.index);
    return normalizeDatabaseState(next);
  }
  if (planStep.op === 'drop_index' && columnOrIndex) {
    targetTable.indexes = targetTable.indexes.filter((index) => index.name !== columnOrIndex);
    return normalizeDatabaseState(next);
  }
  return normalizeDatabaseState(next);
}

function createTableSql(table: DatabaseTable): string {
  const primaryColumns = table.columns.filter((column) => column.primaryKey).map((column) => quoteIdent(column.name));
  const definitions = table.columns.map((column) => columnSql(column));
  if (primaryColumns.length) definitions.push(`primary key (${primaryColumns.join(', ')})`);
  return `create table ${quoteTable(table)} (${definitions.join(', ')});`;
}

function renameTableSql(from: { schema: string; name: string }, to: DatabaseTable): string {
  if (from.schema === to.schema) {
    return `alter table ${quoteQualified(`${from.schema}.${from.name}`)} rename to ${quoteIdent(to.name)};`;
  }
  return [
    `alter table ${quoteQualified(`${from.schema}.${from.name}`)} set schema ${quoteIdent(to.schema)}`,
    `alter table ${quoteQualified(`${to.schema}.${from.name}`)} rename to ${quoteIdent(to.name)};`,
  ].join('; ');
}

function columnSql(column: DatabaseColumn, options: { includeUnique?: boolean } = {}): string {
  const parts = [quoteIdent(column.name), column.type];
  if (!column.nullable) parts.push('not null');
  if (column.default !== null) parts.push(`default ${column.default}`);
  if ((options.includeUnique ?? true) && column.unique && !column.primaryKey) parts.push('unique');
  return parts.join(' ');
}

function addUniqueSql(table: DatabaseTable, column: DatabaseColumn): string {
  const constraint = `${table.name}_${column.name}_uniq`;
  return `alter table ${quoteTable(table)} add constraint ${quoteIdent(constraint)} unique (${quoteIdent(column.name)});`;
}

function quoteTable(table: DatabaseTable): string {
  return `${quoteIdent(table.schema)}.${quoteIdent(table.name)}`;
}

function quoteQualified(value: string): string {
  return value.split('.').map(quoteIdent).join('.');
}

function quoteIdent(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function tableKey(table: Pick<DatabaseTable, 'schema' | 'name'>): string {
  return `${table.schema}.${table.name}`;
}

function compareTable(left: Pick<DatabaseTable, 'schema' | 'name'>, right: Pick<DatabaseTable, 'schema' | 'name'>): number {
  return tableKey(left).localeCompare(tableKey(right));
}

function maxDatabaseRisk(levels: DatabaseRiskLevel[]): DatabaseRiskLevel {
  return levels.reduce<DatabaseRiskLevel>((current, next) => (riskRank(next) > riskRank(current) ? next : current), 'R0_NOOP');
}

function riskRank(level: DatabaseRiskLevel): number {
  return {
    R0_NOOP: 0,
    R1_SAFE_ADDITIVE: 1,
    R2_OPERATIONAL: 2,
    R3_DATA_DEPENDENT: 3,
    R4_BACKWARD_INCOMPATIBLE: 4,
    R5_DESTRUCTIVE: 5,
    R6_IRREVERSIBLE_OR_UNKNOWN: 6,
  }[level];
}

function normalizePostgresType(dataType: string, udtName: string): string {
  if (dataType === 'ARRAY') return `${udtName.replace(/^_/, '')}[]`;
  if (dataType === 'USER-DEFINED') return udtName;
  return dataType;
}

function cloneState(state: CumulusDatabaseState): CumulusDatabaseState {
  return normalizeDatabaseState(JSON.parse(JSON.stringify(state)) as CumulusDatabaseState);
}

function stableHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalStringify(value)).digest('hex')}`;
}

function nowIso(): string {
  return new Date().toISOString();
}
