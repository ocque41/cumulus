// SPDX-License-Identifier: AGPL-3.0-only
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { CumulusDbConfig } from './config.js';
import { parseEnvFile } from './env-parser.js';
import type { NimbusIr } from './nimbus.js';
import type { CumulusDbEngine } from './storage.js';
import { SYSTEM_SCOPE_REGISTRY, isHardSystemScope, type SystemSnapshotRecord, type SystemState } from './system.js';
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

export function createHandler(engine: CumulusDbEngine, config: CumulusDbConfig) {
  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
      const parts = segments(url.pathname);

      if (req.method === 'GET' && url.pathname === '/health') {
        send(res, 200, { ok: true, service: 'cumulus-db' });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/env/parse') {
        const body = await readJson(req);
        send(res, 200, parseEnvFile(stringValue(body.content)));
        return;
      }

      if (req.method === 'GET' && url.pathname === '/v1/system/scopes') {
        send(res, 200, { scopes: SYSTEM_SCOPE_REGISTRY });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/v1/system/agents/bootstrap') {
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
          await requireDbToken(engine, req, dbId, ['member:approve']);
          if (body.kind === 'revert') {
            send(res, 201, {
              approval: await engine.createRevertApproval(dbId, {
                versionId: typeof body.versionId === 'string' ? body.versionId : undefined,
                snapshotId: typeof body.snapshotId === 'string' ? body.snapshotId : undefined,
                actorType: 'human',
                actorId: stringValue(body.actorId, 'operator'),
              }),
            });
            return;
          }
          send(res, 201, {
            approval: await engine.createSchemaApproval(dbId, stringValue(body.planId), 'human', stringValue(body.actorId, 'operator')),
          });
          return;
        }

        if (parts[2] === 'schema' && parts[3] === 'apply' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          const state = await engine.getSystemState(dbId);
          const plan = state.schema.plans.find((item) => item.id === stringValue(body.planId));
          await requireDbToken(engine, req, dbId, [plan?.riskLevel === 'destructive' ? 'schema:apply_destructive' : 'schema:apply_safe']);
          send(res, 200, {
            apply: publicApplyResult(
              await engine.applySchemaPlan(dbId, {
                planId: stringValue(body.planId),
                approvalToken: typeof body.approvalToken === 'string' ? body.approvalToken : undefined,
                actorType: 'human',
                actorId: stringValue(body.actorId, 'operator'),
              }),
            ),
          });
          return;
        }

        if (parts[2] === 'schema' && parts[3] === 'revert' && req.method === 'POST') {
          const body = await readJson(req);
          const dbId = stringValue(body.dbId);
          await requireDbToken(engine, req, dbId, ['schema:revert_local']);
          send(res, 200, {
            revert: publicApplyResult(
              await engine.revertSchema(dbId, {
                versionId: typeof body.versionId === 'string' ? body.versionId : undefined,
                snapshotId: typeof body.snapshotId === 'string' ? body.snapshotId : undefined,
                approvalToken: typeof body.approvalToken === 'string' ? body.approvalToken : undefined,
                actorType: 'human',
                actorId: stringValue(body.actorId, 'operator'),
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
          tools: [
            'cumulus_db_create_record',
            'cumulus_db_search',
            'cumulus_db_append_event',
            'cumulus_db_put_kv',
            'cumulus_db_get_kv',
            'cumulus_db_parse_env',
            'cumulus_db_reveal_secret',
            'cumulus.plan_schema',
            'cumulus.read_system_state',
            'cumulus.request_approval',
            'cumulus.apply_schema',
            'cumulus.create_snapshot',
            'cumulus.revert_version',
            'cumulus.rotate_self_token',
          ],
        });
        return;
      }

      if (req.method === 'POST' && url.pathname === '/mcp') {
        const body = await readJson(req);
        const tool = stringValue(body.tool) || stringValue((body.params as Record<string, unknown> | undefined)?.name);
        const args = (body.arguments ??
          (body.params as Record<string, unknown> | undefined)?.arguments ??
          {}) as Record<string, unknown>;
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
        if (tool === 'cumulus.read_system_state') {
          await requireDbToken(engine, fakeReq, dbId, ['system:read']);
          send(res, 200, { result: publicSystemState(await engine.getSystemState(dbId)) });
          return;
        }
        if (tool === 'cumulus.request_approval') {
          await requireDbToken(engine, fakeReq, dbId, ['member:approve']);
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
          await requireDbToken(engine, fakeReq, dbId, ['backup:create']);
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
