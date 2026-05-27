// SPDX-License-Identifier: AGPL-3.0-only
import { createServer } from 'node:http';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createHandler } from '../http.js';
import { CumulusDbEngine } from '../storage.js';
import {
  appendDatabaseAuditEvent,
  createDatabaseApproval,
  createDatabaseRestorePlan,
  executeDatabasePlan,
  normalizeDatabaseState,
  verifyDatabaseAuditChain,
  type CumulusDatabasePlan,
  type CumulusDatabaseState,
  type DatabaseApplyResult,
  type DatabaseAuditEvent,
  type DatabaseApprovalRecord,
  type DatabaseRestoreResult,
  type DatabaseSnapshot,
  type DatabaseTarget,
} from '../database-transaction.js';
import type { CumulusDbConfig } from '../config.js';
import type { RecordType } from '../types.js';

const cleanup: Array<() => Promise<void> | void> = [];

afterEach(async () => {
  for (const fn of cleanup.splice(0)) await fn();
});

async function testServer(createEngine?: (dataDir: string, masterKey: Buffer) => CumulusDbEngine) {
  const dataDir = await mkdtemp(join(tmpdir(), 'cumulus-db-http-'));
  const config: CumulusDbConfig = {
    engine: 'jsonl',
    dataDir,
    publicUrl: 'http://127.0.0.1:0',
    adminSecret: Buffer.alloc(32, 4).toString('base64'),
    masterKey: Buffer.alloc(32, 4),
    relayWebhookSecret: null,
    publicAgentBootstrapEnabled: false,
    port: 0,
    postgres: { url: null, ssl: false, autoMigrate: false },
    embeddings: { baseUrl: null, apiKey: null, model: null },
  };
  const engine = createEngine ? createEngine(dataDir, config.masterKey) : new CumulusDbEngine(dataDir, config.masterKey);
  const server = createServer(createHandler(engine, config));
  const baseUrl = await new Promise<URL>((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') throw new Error('invalid address');
      resolve(new URL(`http://127.0.0.1:${addr.port}`));
    });
  });
  cleanup.push(() => new Promise<void>((resolve) => server.close(() => resolve())));
  cleanup.push(() => engine.destroyAllForTests());
  return { baseUrl, engine };
}

class InspectingCumulusDbEngine extends CumulusDbEngine {
  inspectCalls: Array<{ target: DatabaseTarget; schemas?: string[] }> = [];

  constructor(
    dataDir: string,
    masterKey: Buffer,
    private readonly inspectedState: CumulusDatabaseState,
  ) {
    super(dataDir, masterKey);
  }

  async inspectDatabaseState(target: DatabaseTarget, options: { schemas?: string[] } = {}): Promise<CumulusDatabaseState> {
    this.inspectCalls.push({ target, schemas: options.schemas });
    return this.inspectedState;
  }
}

class ApplyingCumulusDbEngine extends InspectingCumulusDbEngine {
  applyCalls = 0;

  async applyDatabasePlan(input: {
    plan: CumulusDatabasePlan;
    currentState: CumulusDatabaseState;
    approval?: DatabaseApprovalRecord;
    actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
    snapshotReason?: DatabaseSnapshot['reason'];
    initialAudit?: DatabaseRestoreResult['apply']['audit'];
  }): Promise<DatabaseApplyResult> {
    this.applyCalls += 1;
    return executeDatabasePlan(input);
  }
}

class RestoringCumulusDbEngine extends ApplyingCumulusDbEngine {
  restoreCalls = 0;

  async restoreDatabaseSnapshot(input: {
    snapshot: DatabaseSnapshot;
    actor?: { principalId: string; kind: 'human' | 'agent' | 'system' };
  }): Promise<DatabaseRestoreResult> {
    this.restoreCalls += 1;
    const currentState = await this.inspectDatabaseState(input.snapshot.target, {
      schemas: input.snapshot.state.schemas.map((schema) => schema.name),
    });
    const plan = createDatabaseRestorePlan({ snapshot: input.snapshot, currentState });
    const actor = input.actor ?? { principalId: 'system', kind: 'system' };
    const approval = createDatabaseApproval(plan, {
      principalId: actor.principalId,
      type: actor.kind,
      scopes: ['cumulus.plan.read', 'cumulus.apply', 'cumulus.approve.destructive'],
      reason: 'Restore fixture snapshot',
    });
    const initialAudit: DatabaseRestoreResult['apply']['audit'] = [];
    appendDatabaseAuditEvent(initialAudit, {
      eventType: 'revert.requested',
      actor,
      target: input.snapshot.target,
      subject: { snapshotId: input.snapshot.snapshotId, restorePlanId: plan.planId },
      timestamp: '2026-05-23T12:00:00.000Z',
    });
    const apply = await this.applyDatabasePlan({
      plan,
      currentState,
      approval,
      actor,
      initialAudit,
      snapshotReason: 'revert_point',
    });
    appendDatabaseAuditEvent(apply.audit, {
      eventType: 'revert.completed',
      actor,
      target: input.snapshot.target,
      subject: { snapshotId: input.snapshot.snapshotId, restorePlanId: plan.planId },
      timestamp: apply.applyRun.completedAt,
    });
    return { snapshot: input.snapshot, currentState, plan, approval, apply };
  }
}

describe('HTTP API', () => {
  it('creates records through REST and searches them', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const headers = {
      Authorization: `Bearer ${created.dataToken.token}`,
      'Content-Type': 'application/json',
    };

    const write = await fetch(new URL(`/v1/databases/${created.manifest.id}/records`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'note', content: 'Hybrid search works for agents.' }),
    });
    expect(write.status).toBe(201);

    const search = await fetch(new URL(`/v1/databases/${created.manifest.id}/search`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'hybrid agents' }),
    });
    expect(search.status).toBe(200);
    const body = (await search.json()) as { hits: unknown[] };
    expect(body.hits.length).toBe(1);
  });

  it('stores every public record type and searches by text, vector, type, and limit', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const headers = {
      Authorization: `Bearer ${created.dataToken.token}`,
      'Content-Type': 'application/json',
    };
    const recordTypes: RecordType[] = [
      'document',
      'note',
      'run',
      'message',
      'event',
      'kv',
      'tool_call',
      'artifact',
      'summary',
      'preference',
      'secret',
      'entity',
      'task',
      'observation',
    ];
    const storedTypes = new Set<string>();

    for (const [index, type] of recordTypes.entries()) {
      const payload = {
        type,
        key: type === 'kv' ? 'evidence.key' : undefined,
        title: `Evidence ${type}`,
        content: `Cumulus API evidence record for ${type}.`,
        json: { capability: type, index },
        tags: ['cumulus-api-evidence', type],
        vector: [index + 1, index % 3, 1],
        recordIsSecret: type === 'secret',
        secrets: type === 'secret' ? { EVIDENCE_TOKEN: 'demo-secret-not-real' } : undefined,
      };

      const response =
        type === 'event'
          ? await fetch(new URL(`/v1/databases/${created.manifest.id}/events`, baseUrl), {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            })
          : type === 'kv'
            ? await fetch(new URL(`/v1/databases/${created.manifest.id}/kv/evidence.key`, baseUrl), {
                method: 'PUT',
                headers,
                body: JSON.stringify({ value: payload.json, metadata: { evidence: true } }),
              })
            : await fetch(new URL(`/v1/databases/${created.manifest.id}/records`, baseUrl), {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
              });

      expect(response.status).toBeLessThan(300);
      const body = (await response.json()) as { record: { type: string } };
      storedTypes.add(body.record.type);
    }

    expect([...storedTypes].sort()).toEqual([...recordTypes].sort());

    const textSearch = await fetch(new URL(`/v1/databases/${created.manifest.id}/search`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: 'evidence record', type: 'note', limit: 1 }),
    });
    expect(textSearch.status).toBe(200);
    const textBody = (await textSearch.json()) as { hits: Array<{ record: { type: string } }> };
    expect(textBody.hits).toHaveLength(1);
    expect(textBody.hits[0]?.record.type).toBe('note');

    const vectorSearch = await fetch(new URL(`/v1/databases/${created.manifest.id}/search`, baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ vector: [8, 1, 1], type: 'artifact', limit: 1 }),
    });
    expect(vectorSearch.status).toBe(200);
    const vectorBody = (await vectorSearch.json()) as { hits: Array<{ record: { type: string }; vectorScore: number }> };
    expect(vectorBody.hits).toHaveLength(1);
    expect(vectorBody.hits[0]?.record.type).toBe('artifact');
    expect(vectorBody.hits[0]?.vectorScore).toBeGreaterThan(0);
  });

  it('implements the advertised MCP database tools', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const secret = await engine.writeRecord(created.manifest.id, {
      type: 'secret',
      title: 'MCP secret',
      recordIsSecret: true,
      secrets: { EVIDENCE_TOKEN: 'demo-secret-not-real' },
    });

    const manifest = await fetch(new URL('/mcp', baseUrl));
    expect(manifest.status).toBe(200);
    const manifestBody = (await manifest.json()) as {
      tools: string[];
      toolSchemas: Array<{
        name: string;
        inputSchema: { required: string[] };
        dryRunFirst?: boolean;
        annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean };
      }>;
    };
    expect(manifestBody.tools).toContain('cumulus_db_put_kv');
    expect(manifestBody.tools).toContain('cumulus_db_get_kv');
    expect(manifestBody.tools).toContain('cumulus_db_reveal_secret');
    expect(manifestBody.tools).toContain('cumulus.plan_schema');
    expect(manifestBody.tools).toContain('cumulus.compile_manifest');
    expect(manifestBody.tools).toContain('cumulus.get_plan');
    expect(manifestBody.tools).toContain('cumulus.apply_plan');
    expect(manifestBody.tools).toContain('cumulus.get_audit_events');
    expect(manifestBody.tools).toContain('cumulus.rotate_self_token');
    expect(manifestBody.toolSchemas.find((tool) => tool.name === 'cumulus.apply_schema')?.dryRunFirst).toBe(true);
    expect(manifestBody.toolSchemas.find((tool) => tool.name === 'cumulus.apply_plan')?.dryRunFirst).toBe(true);
    expect(manifestBody.toolSchemas.find((tool) => tool.name === 'cumulus.get_audit_events')?.annotations.readOnlyHint).toBe(true);
    expect(manifestBody.toolSchemas.find((tool) => tool.name === 'cumulus.apply_plan')?.annotations.destructiveHint).toBe(true);
    expect(manifestBody.toolSchemas.find((tool) => tool.name === 'cumulus_db_put_kv')?.inputSchema.required).toEqual([
      'database_id',
      'token',
      'key',
      'value',
    ]);

    const put = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus_db_put_kv',
        arguments: {
          database_id: created.manifest.id,
          token: created.dataToken.token,
          key: 'mcp.evidence',
          value: { ok: true },
        },
      }),
    });
    expect(put.status).toBe(200);

    const get = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus_db_get_kv',
        arguments: {
          database_id: created.manifest.id,
          token: created.dataToken.token,
          key: 'mcp.evidence',
        },
      }),
    });
    expect(get.status).toBe(200);
    const getBody = (await get.json()) as { result: { json: { ok: boolean } } };
    expect(getBody.result.json.ok).toBe(true);

    const reveal = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus_db_reveal_secret',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          record_id: secret.id,
          field: 'EVIDENCE_TOKEN',
        },
      }),
    });
    expect(reveal.status).toBe(200);
    const revealBody = (await reveal.json()) as { result: { value: string } };
    expect(revealBody.result.value).toBe('demo-secret-not-real');

    const nimbusManifest = {
      apiVersion: 'nimbus.db/v0.1',
      kind: 'DatabaseManifest',
      metadata: { name: 'mcp-audit-fixture' },
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'events',
            columns: [{ name: 'id', type: 'uuid', primaryKey: true }],
          },
        ],
      },
    };
    const currentState = normalizeDatabaseState({
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      schemas: [{ id: 'schema.public', name: 'public' }],
      tables: [],
    });
    const createSnapshot = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.create_snapshot',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          target: currentState.target,
          current_state: currentState,
          reason: 'manual',
        },
      }),
    });
    expect(createSnapshot.status).toBe(200);
    const createSnapshotBody = (await createSnapshot.json()) as { result: { snapshotId: string; stateFingerprint: string } };
    expect(createSnapshotBody.result.snapshotId).toMatch(/^snap_/);
    expect(createSnapshotBody.result.stateFingerprint).toBe(currentState.fingerprint);

    const compile = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.compile_manifest',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          manifest: nimbusManifest,
        },
      }),
    });
    expect(compile.status).toBe(200);
    const compileBody = (await compile.json()) as { result: { hash: string } };

    const createPlan = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.create_plan',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          ir: compileBody.result,
          current_state: currentState,
        },
      }),
    });
    expect(createPlan.status).toBe(200);
    const createPlanBody = (await createPlan.json()) as { result: { planId: string; planHash: string } };

    const getPlan = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.get_plan',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          plan_id: createPlanBody.result.planId,
        },
      }),
    });
    expect(getPlan.status).toBe(200);
    const getPlanBody = (await getPlan.json()) as { result: { plan: { planHash: string } } };
    expect(getPlanBody.result.plan.planHash).toBe(createPlanBody.result.planHash);

    const classify = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.classify_risk',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          plan_id: createPlanBody.result.planId,
        },
      }),
    });
    expect(classify.status).toBe(200);

    const approve = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.request_approval',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          plan_id: createPlanBody.result.planId,
          reason: 'MCP approval audit fixture',
        },
      }),
    });
    expect(approve.status).toBe(200);

    const auditEvents = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.get_audit_events',
        arguments: {
          database_id: created.manifest.id,
          token: created.adminToken.token,
          plan_id: createPlanBody.result.planId,
        },
      }),
    });
    expect(auditEvents.status).toBe(200);
    const auditEventsBody = (await auditEvents.json()) as { result: { audit: DatabaseAuditEvent[]; ok: boolean } };
    expect(auditEventsBody.result.ok).toBe(true);
    expect(auditEventsBody.result.audit.map((event) => event.eventType)).toContain('plan.approved');

    const stateResponse = await fetch(new URL(`/v1/system/state?dbId=${created.manifest.id}`, baseUrl), {
      headers: { Authorization: `Bearer ${created.adminToken.token}` },
    });
    expect(stateResponse.status).toBe(200);
    const stateBody = (await stateResponse.json()) as { system: { databaseTransactions: { audit: DatabaseAuditEvent[] } } };
    const mcpEventTypes = stateBody.system.databaseTransactions.audit.map((event) => event.eventType);
    expect(mcpEventTypes).toEqual(expect.arrayContaining([
      'manifest.submitted',
      'manifest.compiled',
      'state.inspected',
      'plan.created',
      'risk.classified',
      'approval.requested',
      'plan.approved',
    ]));
    expect(verifyDatabaseAuditChain(stateBody.system.databaseTransactions.audit)).toBe(true);

    const missing = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tool: 'cumulus_db_put_kv', arguments: { database_id: created.manifest.id, token: created.dataToken.token } }),
    });
    expect(missing.status).toBe(400);
    expect((await missing.json()) as { error: string }).toMatchObject({ error: 'missing required MCP argument(s): key, value' });
  });

  it('does not let legacy token managers mint hard system scopes', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const manager = await engine.createToken(created.manifest.id, 'legacy token manager', ['tokens:manage']);
    const creator = await engine.createToken(created.manifest.id, 'limited system token creator', ['token:create']);

    const blocked = await fetch(new URL(`/v1/databases/${created.manifest.id}/tokens`, baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${manager.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ label: 'system reader', scopes: ['system:read'] }),
    });
    expect(blocked.status).toBe(401);

    const escalated = await fetch(new URL(`/v1/databases/${created.manifest.id}/tokens`, baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${creator.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ label: 'destructive applier', scopes: ['schema:apply_destructive'] }),
    });
    expect(escalated.status).toBe(401);

    const allowed = await fetch(new URL(`/v1/databases/${created.manifest.id}/tokens`, baseUrl), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${created.adminToken.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ label: 'system reader', scopes: ['system:read'] }),
    });
    expect(allowed.status).toBe(201);
    const allowedBody = (await allowed.json()) as { token: { token: string } };
    expect(allowedBody.token.token).toMatch(/^cu_pat_v1_/);
  });

  it('exposes the Nimbus database transaction lifecycle over HTTP', async () => {
    const { baseUrl, engine } = await testServer();
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1', humanOwnerEmail: 'owner@example.com' });
    const operator = await engine.createToken(created.manifest.id, 'database transaction operator', [
      'schema:plan',
      'member:approve',
      'schema:apply_safe',
      'schema:apply_destructive',
      'schema:revert_local',
      'audit:read',
      'backup:create',
      'system:read',
    ]);
    const headers = {
      Authorization: `Bearer ${operator.token}`,
      'Content-Type': 'application/json',
    };
    const manifest = {
      apiVersion: 'nimbus.db/v0.1',
      kind: 'DatabaseManifest',
      metadata: { name: 'customer-core', workspace: 'demo' },
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'text', nullable: false, unique: true },
              { name: 'display_name', type: 'text', nullable: true },
            ],
          },
        ],
      },
      policies: { destructiveChanges: 'require_approval', snapshotBefore: ['destructive', 'irreversible', 'high'] },
    };
    const currentState = normalizeDatabaseState({
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      schemas: [{ id: 'schema.public', name: 'public' }],
      tables: [
        {
          id: 'table.public.users',
          schema: 'public',
          name: 'users',
          columns: [
            { id: 'column.public.users.id', name: 'id', type: 'uuid', nullable: false, primaryKey: true, unique: false, default: null },
            { id: 'column.public.users.email', name: 'email', type: 'text', nullable: false, primaryKey: false, unique: true, default: null },
            { id: 'column.public.users.legacy_code', name: 'legacy_code', type: 'text', nullable: true, primaryKey: false, unique: false, default: null },
          ],
          indexes: [],
        },
      ],
    });

    const manualSnapshot = await fetch(new URL('/v1/database/snapshots', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dbId: created.manifest.id,
        target: currentState.target,
        currentState,
        reason: 'manual',
      }),
    });
    expect(manualSnapshot.status).toBe(201);
    const manualSnapshotBody = (await manualSnapshot.json()) as { snapshot: { snapshotId: string; stateFingerprint: string } };
    expect(manualSnapshotBody.snapshot.snapshotId).toMatch(/^snap_/);
    expect(manualSnapshotBody.snapshot.stateFingerprint).toBe(currentState.fingerprint);

    const compile = await fetch(new URL('/v1/database/manifests:compile', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, manifest }),
    });
    expect(compile.status).toBe(200);
    const compileBody = (await compile.json()) as { ir: { hash: string } };
    expect(compileBody.ir.hash).toMatch(/^sha256:[a-f0-9]{64}$/);

    const planResponse = await fetch(new URL('/v1/database/plans', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, ir: compileBody.ir, currentState }),
    });
    expect(planResponse.status).toBe(200);
    const planBody = (await planResponse.json()) as { plan: { planId: string; summary: { highestRisk: string }; steps: Array<{ op: string }>; planHash: string } };
    expect(planBody.plan.summary.highestRisk).toBe('R5_DESTRUCTIVE');
    expect(planBody.plan.steps.map((step) => step.op)).toEqual(['add_column', 'drop_column']);

    const getPlanResponse = await fetch(new URL(`/v1/database/plans/${planBody.plan.planId}?dbId=${created.manifest.id}`, baseUrl), { headers });
    expect(getPlanResponse.status).toBe(200);
    const getPlanBody = (await getPlanResponse.json()) as { plan: { planHash: string }; status: string };
    expect(getPlanBody.plan.planHash).toBe(planBody.plan.planHash);
    expect(getPlanBody.status).toBe('planned');

    const classified = await fetch(new URL('/mcp', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'cumulus.classify_risk',
        arguments: {
          database_id: created.manifest.id,
          token: operator.token,
          plan_id: planBody.plan.planId,
        },
      }),
    });
    expect(classified.status).toBe(200);

    const rejectedApply = await fetch(new URL('/v1/database/plans:apply', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, planId: planBody.plan.planId, currentState }),
    });
    expect(rejectedApply.status).toBe(400);
    expect(((await rejectedApply.json()) as { error: string }).error).toContain('APPROVAL_REQUIRED');

    const approval = await fetch(new URL('/v1/database/plans:approve', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, planId: planBody.plan.planId, reason: 'Approved for dev fixture reset' }),
    });
    expect(approval.status).toBe(201);
    const approvalBody = (await approval.json()) as { approval: { approvalId: string; planHash: string } };
    expect(approvalBody.approval.planHash).toBe(planBody.plan.planHash);

    const applied = await fetch(new URL('/v1/database/plans:apply', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dbId: created.manifest.id,
        planId: planBody.plan.planId,
        currentState,
        approvalId: approvalBody.approval.approvalId,
      }),
    });
    expect(applied.status).toBe(200);
    const appliedBody = (await applied.json()) as {
      apply: {
        state: { tables: Array<{ columns: Array<{ name: string }> }> };
        snapshot: { stateFingerprint: string };
        audit: unknown[];
      };
    };
    expect(appliedBody.apply.state.tables[0]?.columns.map((column) => column.name).sort()).toEqual(['display_name', 'email', 'id']);
    expect(appliedBody.apply.snapshot.stateFingerprint).toBe(currentState.fingerprint);

    const stateResponse = await fetch(new URL(`/v1/system/state?dbId=${created.manifest.id}`, baseUrl), { headers });
    const stateBody = (await stateResponse.json()) as {
      system: {
        databaseTransactions: {
          plans: Array<{ status: string; plan: { planId: string } }>;
          approvals: Array<{ approvalId: string; usedAt: string | null }>;
          applyRuns: Array<{ status: string; error?: { code: string } }>;
          audit: DatabaseAuditEvent[];
        };
      };
    };
    expect(stateBody.system.databaseTransactions.plans.find((item) => item.plan.planId === planBody.plan.planId)?.status).toBe('applied');
    expect(stateBody.system.databaseTransactions.approvals.find((item) => item.approvalId === approvalBody.approval.approvalId)?.usedAt).toBeTruthy();
    expect(stateBody.system.databaseTransactions.applyRuns.some((run) => run.status === 'failed' && run.error?.code === 'APPROVAL_REQUIRED')).toBe(true);
    const eventTypes = stateBody.system.databaseTransactions.audit.map((event) => event.eventType);
    expect(eventTypes).toEqual(expect.arrayContaining([
      'manifest.submitted',
      'manifest.compiled',
      'state.inspected',
      'plan.created',
      'risk.classified',
      'approval.requested',
      'plan.approved',
      'apply.failed',
      'snapshot.created',
      'apply.completed',
    ]));
    expect(verifyDatabaseAuditChain(stateBody.system.databaseTransactions.audit)).toBe(true);

    const auditResponse = await fetch(new URL(`/v1/database/audit?dbId=${created.manifest.id}&planId=${planBody.plan.planId}`, baseUrl), { headers });
    expect(auditResponse.status).toBe(200);
    const auditBody = (await auditResponse.json()) as { audit: DatabaseAuditEvent[]; ok: boolean };
    expect(auditBody.ok).toBe(true);
    expect(auditBody.audit.map((event) => event.eventType)).toEqual(expect.arrayContaining(['plan.created', 'plan.approved', 'apply.completed']));

    const restore = await fetch(new URL('/v1/database/snapshots:restore', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, snapshot: appliedBody.apply.snapshot }),
    });
    expect(restore.status).toBe(200);
    const restoreBody = (await restore.json()) as { state: { tables: Array<{ columns: Array<{ name: string }> }> } };
    expect(restoreBody.state.tables[0]?.columns.map((column) => column.name).sort()).toEqual(['email', 'id', 'legacy_code']);

    const auditVerify = await fetch(new URL('/v1/database/audit:verify', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, audit: appliedBody.apply.audit }),
    });
    expect(auditVerify.status).toBe(200);
    expect(await auditVerify.json()).toEqual({ ok: true });
  });

  it('uses live database inspection when currentState is omitted', async () => {
    const inspectedState = normalizeDatabaseState({
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      schemas: [{ id: 'schema.public', name: 'public' }],
      tables: [
        {
          id: 'table.public.users',
          schema: 'public',
          name: 'users',
          columns: [
            { id: 'column.public.users.id', name: 'id', type: 'uuid', nullable: false, primaryKey: true, unique: false, default: null },
          ],
          indexes: [],
        },
      ],
    });
    const { baseUrl, engine } = await testServer((dataDir, masterKey) => new ApplyingCumulusDbEngine(dataDir, masterKey, inspectedState));
    const inspectingEngine = engine as ApplyingCumulusDbEngine;
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const operator = await engine.createToken(created.manifest.id, 'database transaction operator', [
      'schema:plan',
      'schema:apply_safe',
      'system:read',
    ]);
    const headers = {
      Authorization: `Bearer ${operator.token}`,
      'Content-Type': 'application/json',
    };
    const manifest = {
      apiVersion: 'nimbus.db/v0.1',
      kind: 'DatabaseManifest',
      metadata: { name: 'customer-core' },
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'display_name', type: 'text', nullable: true },
            ],
          },
        ],
      },
    };

    const planResponse = await fetch(new URL('/v1/database/plans', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, manifest }),
    });
    expect(planResponse.status).toBe(200);
    const planBody = (await planResponse.json()) as { plan: { planId: string; steps: Array<{ op: string }> } };
    expect(planBody.plan.steps.map((step) => step.op)).toEqual(['add_column']);
    expect(inspectingEngine.inspectCalls[0]).toMatchObject({
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      schemas: ['public'],
    });

    const applied = await fetch(new URL('/v1/database/plans:apply', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, planId: planBody.plan.planId }),
    });
    expect(applied.status).toBe(200);
    const appliedBody = (await applied.json()) as { apply: { state: { tables: Array<{ columns: Array<{ name: string }> }> } } };
    expect(appliedBody.apply.state.tables[0]?.columns.map((column) => column.name).sort()).toEqual(['display_name', 'id']);
    expect(inspectingEngine.inspectCalls).toHaveLength(2);
    expect(inspectingEngine.applyCalls).toBe(1);
  });

  it('persists engine-backed database snapshot restores', async () => {
    const currentState = normalizeDatabaseState({
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      schemas: [{ id: 'schema.public', name: 'public' }],
      tables: [
        {
          id: 'table.public.users',
          schema: 'public',
          name: 'users',
          columns: [
            { id: 'column.public.users.id', name: 'id', type: 'uuid', nullable: false, primaryKey: true, unique: false, default: null },
            { id: 'column.public.users.display_name', name: 'display_name', type: 'text', nullable: true, primaryKey: false, unique: false, default: null },
          ],
          indexes: [],
        },
      ],
    });
    const snapshotState = normalizeDatabaseState({
      target: { engine: 'postgres', database: 'app', environment: 'dev' },
      schemas: [{ id: 'schema.public', name: 'public' }],
      tables: [
        {
          id: 'table.public.users',
          schema: 'public',
          name: 'users',
          columns: [
            { id: 'column.public.users.id', name: 'id', type: 'uuid', nullable: false, primaryKey: true, unique: false, default: null },
          ],
          indexes: [],
        },
      ],
    });
    const snapshot: DatabaseSnapshot = {
      snapshotId: 'snap_restorefixture',
      target: snapshotState.target,
      provider: 'postgres.logical_state.v0',
      reason: 'pre_destructive_apply',
      planId: 'plan_original',
      createdAt: '2026-05-23T12:00:00.000Z',
      verified: true,
      stateFingerprint: snapshotState.fingerprint,
      state: snapshotState,
    };
    const { baseUrl, engine } = await testServer((dataDir, masterKey) => new RestoringCumulusDbEngine(dataDir, masterKey, currentState));
    const restoringEngine = engine as RestoringCumulusDbEngine;
    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1' });
    const operator = await engine.createToken(created.manifest.id, 'database restore operator', [
      'schema:revert_local',
      'system:read',
    ]);
    const headers = {
      Authorization: `Bearer ${operator.token}`,
      'Content-Type': 'application/json',
    };

    const restore = await fetch(new URL('/v1/database/snapshots:restore', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, snapshot }),
    });

    expect(restore.status).toBe(200);
    const restoreBody = (await restore.json()) as { state: { fingerprint: string; tables: Array<{ columns: Array<{ name: string }> }> } };
    expect(restoreBody.state.fingerprint).toBe(snapshotState.fingerprint);
    expect(restoreBody.state.tables[0]?.columns.map((column) => column.name)).toEqual(['id']);
    expect(restoringEngine.restoreCalls).toBe(1);

    const stateResponse = await fetch(new URL(`/v1/system/state?dbId=${created.manifest.id}`, baseUrl), { headers });
    const stateBody = (await stateResponse.json()) as {
      system: {
        databaseTransactions: {
          currentStateFingerprint: string;
          plans: Array<{ status: string }>;
          approvals: Array<{ usedAt: string | null }>;
          audit: DatabaseAuditEvent[];
        };
      };
    };
    expect(stateBody.system.databaseTransactions.currentStateFingerprint).toBe(snapshotState.fingerprint);
    expect(stateBody.system.databaseTransactions.plans.at(-1)?.status).toBe('applied');
    expect(stateBody.system.databaseTransactions.approvals.at(-1)?.usedAt).toBeTruthy();
    expect(stateBody.system.databaseTransactions.audit.map((event) => event.eventType)).toContain('revert.completed');
    expect(verifyDatabaseAuditChain(stateBody.system.databaseTransactions.audit)).toBe(true);
  });

  it('exposes system bootstrap and schema lifecycle endpoints with hard scopes', async () => {
    const { baseUrl, engine } = await testServer();

    const bootstrap = await fetch(new URL('/v1/system/agents/bootstrap', baseUrl), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ displayName: 'builder-agent' }),
    });
    expect(bootstrap.status).toBe(401);

    const authorizedBootstrap = await fetch(new URL('/v1/system/agents/bootstrap', baseUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cumulus-Admin-Key': Buffer.alloc(32, 4).toString('base64'),
      },
      body: JSON.stringify({ displayName: 'builder-agent' }),
    });
    expect(authorizedBootstrap.status).toBe(201);
    const bootBody = (await authorizedBootstrap.json()) as {
      databaseId: string;
      token: { token: string };
    };
    expect(bootBody.token.token).toMatch(/^cu_agt_v1_/);

    const agentHeaders = {
      Authorization: `Bearer ${bootBody.token.token}`,
      'Content-Type': 'application/json',
    };
    const agentPlan = await fetch(new URL('/v1/system/schema/plan', baseUrl), {
      method: 'POST',
      headers: agentHeaders,
      body: JSON.stringify({
        dbId: bootBody.databaseId,
        source: 'namespace acme { collection notes { fields: { id: { type: "ulid" } } } }',
      }),
    });
    expect(agentPlan.status).toBe(200);
    const agentPlanBody = (await agentPlan.json()) as { plan: { id: string } };

    const agentApply = await fetch(new URL('/v1/system/schema/apply', baseUrl), {
      method: 'POST',
      headers: agentHeaders,
      body: JSON.stringify({ dbId: bootBody.databaseId, planId: agentPlanBody.plan.id }),
    });
    expect(agentApply.status).toBe(401);

    const created = await engine.createWorkspace({ ownerAgentId: 'agent-1', humanOwnerEmail: 'owner@example.com' });
    const operator = await engine.createToken(created.manifest.id, 'schema operator', [
      'system:read',
      'audit:read',
      'member:approve',
      'schema:plan',
      'schema:apply_safe',
      'schema:apply_destructive',
      'schema:revert_local',
      'backup:create',
    ]);
    const headers = {
      Authorization: `Bearer ${operator.token}`,
      'Content-Type': 'application/json',
    };

    const initialPlan = await fetch(new URL('/v1/system/schema/plan', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dbId: created.manifest.id,
        source: `
          namespace acme {
            collection agents {
              fields: {
                id: { type: "ulid", required: true },
                status: { type: "string" }
              }
            }
          }
        `,
      }),
    });
    expect(initialPlan.status).toBe(200);
    const initialPlanBody = (await initialPlan.json()) as { plan: { id: string; riskLevel: string } };
    expect(initialPlanBody.plan.riskLevel).toBe('low');

    const initialApply = await fetch(new URL('/v1/system/schema/apply', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, planId: initialPlanBody.plan.id }),
    });
    expect(initialApply.status).toBe(200);
    const initialApplyBody = (await initialApply.json()) as { apply: { versionId: string } };
    expect(initialApplyBody.apply.versionId).toMatch(/^ver_/);

    const destructivePlan = await fetch(new URL('/v1/system/schema/plan', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dbId: created.manifest.id,
        source: `
          namespace acme {
            collection agents {
              fields: { id: { type: "ulid", required: true } }
            }
          }
        `,
      }),
    });
    const destructivePlanBody = (await destructivePlan.json()) as { plan: { id: string; riskLevel: string } };
    expect(destructivePlanBody.plan.riskLevel).toBe('destructive');

    const rejectedApply = await fetch(new URL('/v1/system/schema/apply', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, planId: destructivePlanBody.plan.id }),
    });
    expect(rejectedApply.status).toBe(400);

    const approval = await fetch(new URL('/v1/system/schema/approvals', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, planId: destructivePlanBody.plan.id }),
    });
    expect(approval.status).toBe(201);
    const approvalBody = (await approval.json()) as { approval: { approvalToken: string } };

    const destructiveApply = await fetch(new URL('/v1/system/schema/apply', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dbId: created.manifest.id,
        planId: destructivePlanBody.plan.id,
        approvalToken: approvalBody.approval.approvalToken,
      }),
    });
    expect(destructiveApply.status).toBe(200);
    const destructiveApplyBody = (await destructiveApply.json()) as { apply: { snapshot: { id: string; path?: string; storage: string } } };
    expect(destructiveApplyBody.apply.snapshot.id).toMatch(/^snap_/);
    expect(destructiveApplyBody.apply.snapshot.storage).toBe('provider-managed');
    expect(destructiveApplyBody.apply.snapshot.path).toBeUndefined();

    const state = await fetch(new URL(`/v1/system/state?dbId=${created.manifest.id}`, baseUrl), { headers });
    const stateBody = (await state.json()) as { system: { approvals: Array<{ tokenHash?: string }>; schema: { snapshots: Array<{ path?: string }> } } };
    expect(JSON.stringify(stateBody.system.approvals)).not.toContain('tokenHash');
    expect(stateBody.system.schema.snapshots.some((snapshot) => snapshot.path)).toBe(false);

    const revertApproval = await fetch(new URL('/v1/system/schema/approvals', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({ dbId: created.manifest.id, kind: 'revert', versionId: initialApplyBody.apply.versionId }),
    });
    const revertApprovalBody = (await revertApproval.json()) as { approval: { approvalToken: string } };

    const revert = await fetch(new URL('/v1/system/schema/revert', baseUrl), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dbId: created.manifest.id,
        versionId: initialApplyBody.apply.versionId,
        approvalToken: revertApprovalBody.approval.approvalToken,
      }),
    });
    expect(revert.status).toBe(200);

    const audit = await fetch(new URL(`/v1/system/audit?dbId=${created.manifest.id}`, baseUrl), { headers });
    expect(audit.status).toBe(200);
    const auditBody = (await audit.json()) as { audit: unknown[] };
    expect(JSON.stringify(auditBody.audit)).toContain('system.schema_revert');
  });
});
