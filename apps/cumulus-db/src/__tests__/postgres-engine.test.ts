// SPDX-License-Identifier: AGPL-3.0-only
import { spawnSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { createServer as createNetServer } from 'node:net';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadConfig } from '../config.js';
import { createHandler } from '../http.js';
import { PostgresCumulusDbEngine } from '../postgres-engine.js';
import {
  compileDatabaseManifest,
  createDatabaseApproval,
  createDatabasePlan,
  databaseStateToIr,
  normalizeDatabaseState,
  type DatabaseTarget,
  type NimbusDatabaseManifest,
} from '../database-transaction.js';

interface TemporaryPostgres {
  url: string;
  stop(): Promise<void>;
}

interface TestPgPool {
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<{ rows: T[] }>;
  end(): Promise<void>;
}

const require = createRequire(import.meta.url);
const { Pool: TestPgPoolCtor } = require('pg') as {
  Pool: new (config: { connectionString: string }) => TestPgPool;
};

const initialSource = `
namespace pgtest {
  collection agents {
    fields: {
      id: { type: "ulid", required: true },
      status: { type: "string", required: false }
    }
  }
}
`;

const destructiveSource = `
namespace pgtest {
  collection agents {
    fields: {
      id: { type: "ulid", required: true }
    }
  }
}
`;

async function findExecutable(name: string): Promise<string | null> {
  const commonPaths = [
    `/opt/homebrew/bin/${name}`,
    `/opt/homebrew/opt/postgresql@17/bin/${name}`,
    `/opt/homebrew/opt/postgresql@16/bin/${name}`,
    `/opt/homebrew/opt/postgresql@15/bin/${name}`,
    `/usr/local/bin/${name}`,
    `/usr/local/opt/postgresql@17/bin/${name}`,
    `/usr/local/opt/postgresql@16/bin/${name}`,
    `/usr/local/opt/postgresql@15/bin/${name}`,
    `/usr/lib/postgresql/17/bin/${name}`,
    `/usr/lib/postgresql/16/bin/${name}`,
    `/usr/lib/postgresql/15/bin/${name}`,
  ];
  for (const candidate of commonPaths) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next common installation path.
    }
  }

  const result = spawnSync('which', [name], { encoding: 'utf8' });
  if (result.status === 0 && result.stdout.trim()) return result.stdout.trim();
  return null;
}

function run(command: string, args: string[], cwd?: string): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    timeout: 30_000,
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || result.stdout}`);
  }
}

async function freePort(): Promise<number> {
  const server = createNetServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('failed to allocate a test port');
  await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  return address.port;
}

async function startTemporaryPostgres(): Promise<TemporaryPostgres | null> {
  if (process.env.CUMULUS_DB_POSTGRES_TESTS !== 'true') {
    console.warn('Skipping Postgres runtime tests because CUMULUS_DB_POSTGRES_TESTS is not true.');
    return null;
  }

  const initdb = await findExecutable('initdb');
  const pgCtl = await findExecutable('pg_ctl');
  if (!initdb || !pgCtl) {
    console.warn('Skipping Postgres runtime tests because initdb or pg_ctl was not found.');
    return null;
  }

  const root = await mkdtemp(join(tmpdir(), 'cumulus-postgres-'));
  const dataDir = join(root, 'data');
  const socketDir = join(root, 'socket');
  await mkdir(socketDir, { recursive: true });
  const port = await freePort();

  try {
    run(initdb, ['-D', dataDir, '-A', 'trust', '-U', 'postgres', '--no-instructions'], root);
    run(pgCtl, ['-D', dataDir, '-o', `-F -p ${port} -h 127.0.0.1 -k ${socketDir}`, '-w', 'start'], root);
  } catch (err) {
    await rm(root, { recursive: true, force: true });
    console.warn(`Skipping Postgres runtime tests because temporary Postgres could not start: ${(err as Error).message}`);
    return null;
  }

  return {
    url: `postgres://postgres@127.0.0.1:${port}/postgres`,
    async stop() {
      spawnSync(pgCtl, ['-D', dataDir, '-m', 'fast', '-w', 'stop'], {
        cwd: root,
        encoding: 'utf8',
        timeout: 30_000,
      });
      await rm(root, { recursive: true, force: true });
    },
  };
}

async function withTemporaryPostgres(fn: (postgres: TemporaryPostgres) => Promise<void>): Promise<void> {
  const postgres = await startTemporaryPostgres();
  if (!postgres) return;
  try {
    await fn(postgres);
  } finally {
    await postgres.stop();
  }
}

async function withPostgresQuery<T>(url: string, fn: (pool: TestPgPool) => Promise<T>): Promise<T> {
  const pool = new TestPgPoolCtor({ connectionString: url });
  try {
    return await fn(pool);
  } finally {
    await pool.end();
  }
}

describe('PostgresCumulusDbEngine', () => {
  it('passes core storage and system conformance', async () => {
    await withTemporaryPostgres(async (postgres) => {
      const engine = new PostgresCumulusDbEngine({
        connectionString: postgres.url,
        autoMigrate: true,
        masterKey: Buffer.alloc(32, 11),
      });
      try {
        await engine.ensureRoot();
        const created = await engine.createWorkspace({
          ownerAgentId: 'agent-1',
          humanOwnerEmail: 'owner@example.com',
          relaySignupId: 'signup-1',
        });

        await engine.authenticate(created.manifest.id, created.dataToken.token, ['records:write']);
        const record = await engine.writeRecord(created.manifest.id, {
          type: 'document',
          title: 'Postgres memory',
          content: 'Remember the hosted Cumulus runtime.',
          tags: ['postgres'],
        });
        expect((await engine.getRecord(created.manifest.id, record.id))?.title).toBe('Postgres memory');
        expect((await engine.search(created.manifest.id, { query: 'hosted runtime' }))[0]?.record.id).toBe(record.id);

        const secret = await engine.writeRecord(created.manifest.id, {
          type: 'secret',
          content: 'sk-test-postgres-secret',
          recordIsSecret: true,
          secrets: { OPENAI_API_KEY: 'sk-test-postgres-secret' },
        });
        expect(secret.content).toBe('[secret]');
        expect((await engine.revealSecret(created.manifest.id, secret.id, 'OPENAI_API_KEY')).value).toContain('sk-test');

        await engine.putKeyValue(created.manifest.id, 'launch', { ready: true });
        expect((await engine.getKeyValue(created.manifest.id, 'launch'))?.json).toEqual({ ready: true });

        const compaction = await engine.compact(created.manifest.id);
        expect(compaction.records).toBe(3);
        const backup = await engine.backup(created.manifest.id);
        expect(backup.path).toMatch(/^postgres:\/\/cumulus_data\.snapshots\//);

        const firstPlan = await engine.planSchema(created.manifest.id, { source: initialSource });
        expect(firstPlan.riskLevel).toBe('low');
        const firstApply = await engine.applySchemaPlan(created.manifest.id, { planId: firstPlan.id });
        expect(firstApply.snapshot).toBeNull();

        const destructivePlan = await engine.planSchema(created.manifest.id, { source: destructiveSource });
        expect(destructivePlan.riskLevel).toBe('destructive');
        await expect(engine.applySchemaPlan(created.manifest.id, { planId: destructivePlan.id })).rejects.toThrow('approval');
        const approval = await engine.createSchemaApproval(created.manifest.id, destructivePlan.id);
        const destructiveApply = await engine.applySchemaPlan(created.manifest.id, {
          planId: destructivePlan.id,
          approvalToken: approval.approvalToken,
        });
        expect(destructiveApply.snapshot?.path).toMatch(/^postgres:\/\/cumulus_data\.snapshots\//);

        const revertApproval = await engine.createRevertApproval(created.manifest.id, { versionId: firstApply.versionId });
        await engine.revertSchema(created.manifest.id, {
          versionId: firstApply.versionId,
          approvalToken: revertApproval.approvalToken,
        });
        expect((await engine.getSystemState(created.manifest.id)).schema.live?.spec.collections[0]?.fields.status).toBeTruthy();
        expect((await engine.listAudit(created.manifest.id)).some((event) => JSON.stringify(event).includes('system.schema_revert'))).toBe(true);
      } finally {
        await engine.destroyAllForTests().catch(() => undefined);
      }
    });
  }, 120_000);

  it('applies a Nimbus database plan against live Postgres', async () => {
    await withTemporaryPostgres(async (postgres) => {
      const engine = new PostgresCumulusDbEngine({
        connectionString: postgres.url,
        autoMigrate: true,
        masterKey: Buffer.alloc(32, 13),
      });
      try {
        await engine.ensureRoot();
        const target: DatabaseTarget = { engine: 'postgres', database: 'app', environment: 'dev' };
        const currentState = await engine.inspectDatabaseState(target, { schemas: ['public'] });
        const manifest: NimbusDatabaseManifest = {
          apiVersion: 'nimbus.db/v0.1',
          kind: 'DatabaseManifest',
          metadata: { name: 'live-postgres-plan' },
          target,
          resources: {
            schemas: [{ name: 'public' }],
            tables: [
              {
                schema: 'public',
                name: 'nimbus_users',
                columns: [
                  { name: 'id', type: 'uuid', primaryKey: true },
                  { name: 'email', type: 'text', nullable: true },
                ],
                indexes: [{ name: 'nimbus_users_email_idx', columns: ['email'] }],
              },
            ],
          },
        };
        const plan = createDatabasePlan({ ir: compileDatabaseManifest(manifest), currentState });
        const applied = await engine.applyDatabasePlan({ plan, currentState });
        const liveState = await engine.inspectDatabaseState(target, { schemas: ['public'] });

        expect(plan.steps.map((step) => step.op)).toEqual(['create_table', 'add_index']);
        expect(applied.state.fingerprint).toBe(liveState.fingerprint);
        expect(liveState.tables.find((table) => table.name === 'nimbus_users')?.indexes[0]?.name).toBe('nimbus_users_email_idx');

        const destructiveManifest: NimbusDatabaseManifest = {
          ...manifest,
          resources: {
            schemas: [{ name: 'public' }],
            tables: [
              {
                schema: 'public',
                name: 'nimbus_users',
                columns: [
                  { name: 'id', type: 'uuid', primaryKey: true },
                ],
              },
            ],
          },
        };
        const destructivePlan = createDatabasePlan({ ir: compileDatabaseManifest(destructiveManifest), currentState: liveState });
        const destructiveApproval = createDatabaseApproval(destructivePlan, {
          principalId: 'postgres-test',
          reason: 'Drop email column for restore fixture',
        });
        const destructiveApply = await engine.applyDatabasePlan({
          plan: destructivePlan,
          currentState: liveState,
          approval: destructiveApproval,
          actor: { principalId: 'postgres-test', kind: 'system' },
        });
        expect(destructiveApply.snapshot?.stateFingerprint).toBe(liveState.fingerprint);
        const restore = await engine.restoreDatabaseSnapshot({
          snapshot: destructiveApply.snapshot!,
          actor: { principalId: 'postgres-test', kind: 'system' },
        });
        const restoredLiveState = await engine.inspectDatabaseState(target, { schemas: ['public'] });
        expect(restore.apply.state.fingerprint).toBe(destructiveApply.snapshot!.stateFingerprint);
        expect(restoredLiveState.fingerprint).toBe(destructiveApply.snapshot!.stateFingerprint);
        expect(restore.apply.audit.map((event) => event.eventType)).toContain('revert.completed');

        await withPostgresQuery(postgres.url, async (pool) => {
          await pool.query('create table public.dirty_users (id integer, email text)');
          await pool.query("insert into public.dirty_users (id, email) values (1, 'dupe@example.com'), (2, 'dupe@example.com')");
        });
        const dirtyState = await engine.inspectDatabaseState(target, { schemas: ['public'] });
        const desiredUniqueState = normalizeDatabaseState({
          ...dirtyState,
          tables: dirtyState.tables.map((table) =>
            table.name === 'dirty_users'
              ? {
                  ...table,
                  columns: table.columns.map((column) =>
                    column.name === 'email'
                      ? { ...column, unique: true }
                      : column,
                  ),
                }
              : table,
          ),
        });
        const uniquePlan = createDatabasePlan({
          ir: databaseStateToIr(desiredUniqueState, { name: 'dirty-unique-preflight' }),
          currentState: dirtyState,
        });
        const uniqueApproval = createDatabaseApproval(uniquePlan, {
          principalId: 'postgres-test',
          reason: 'Validate dirty unique preflight',
        });
        expect(uniquePlan.summary.highestRisk).toBe('R3_DATA_DEPENDENT');
        expect(uniquePlan.steps.map((step) => step.op)).toContain('add_unique_constraint');
        await expect(
          engine.applyDatabasePlan({
            plan: uniquePlan,
            currentState: dirtyState,
            approval: uniqueApproval,
            actor: { principalId: 'postgres-test', kind: 'system' },
          }),
        ).rejects.toThrow('PREFLIGHT_UNIQUE_VIOLATION');
      } finally {
        await engine.destroyAllForTests().catch(() => undefined);
      }
    });
  }, 120_000);

  it('serves HTTP through the Postgres engine', async () => {
    await withTemporaryPostgres(async (postgres) => {
      const key = Buffer.alloc(32, 12).toString('base64');
      const config = loadConfig({
        CUMULUS_DB_ENGINE: 'postgres',
        CUMULUS_DB_POSTGRES_URL: postgres.url,
        CUMULUS_DB_AUTO_MIGRATE: 'true',
        CUMULUS_DB_MASTER_KEY: key,
        CUMULUS_DB_RELAY_WEBHOOK_SECRET: 'relay-postgres-secret',
        CUMULUS_DB_PUBLIC_URL: 'http://127.0.0.1:0',
        CUMULUS_DB_PORT: '4317',
      });
      const engine = new PostgresCumulusDbEngine({
        connectionString: config.postgres.url ?? '',
        ssl: config.postgres.ssl,
        autoMigrate: config.postgres.autoMigrate,
        masterKey: config.masterKey,
      });
      const server = createServer(createHandler(engine, config));
      try {
        await engine.ensureRoot();
        const address = await new Promise<URL>((resolve) => {
          server.listen(0, '127.0.0.1', () => {
            const addr = server.address();
            if (!addr || typeof addr === 'string') throw new Error('invalid server address');
            resolve(new URL(`http://127.0.0.1:${addr.port}`));
          });
        });

        const relayBody = JSON.stringify({
          kind: 'signup',
          signupId: '22222222-2222-4222-8222-222222222222',
          email: 'postgres-smoke@example.com',
          input: { email: 'postgres-smoke@example.com', agent_id: 'postgres-smoke-agent' },
          provider_slug: 'cumulus-database',
        });
        const relaySignup = await fetch(new URL('/v1/relay/signup', address), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Relay-Signature': `sha256=${createHmac('sha256', 'relay-postgres-secret').update(relayBody).digest('hex')}`,
          },
          body: relayBody,
        });
        expect(relaySignup.ok).toBe(true);
        const signup = (await relaySignup.json()) as {
          credentials: {
            database_id: string;
            data_token: string;
          };
        };

        const create = await fetch(new URL(`/v1/databases/${signup.credentials.database_id}/records`, address), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${signup.credentials.data_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'note',
            title: 'Postgres smoke',
            content: 'The HTTP handler is using PostgreSQL.',
            tags: ['smoke'],
          }),
        });
        expect(create.status).toBe(201);

        const search = await fetch(new URL(`/v1/databases/${signup.credentials.database_id}/search`, address), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${signup.credentials.data_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: 'PostgreSQL' }),
        });
        const payload = (await search.json()) as { hits?: unknown[] };
        expect(search.ok).toBe(true);
        expect(payload.hits?.length).toBeGreaterThan(0);
      } finally {
        await new Promise<void>((resolve, reject) => server.close((err) => (err ? reject(err) : resolve()))).catch(() => undefined);
        await engine.destroyAllForTests().catch(() => undefined);
      }
    });
  }, 120_000);
});
