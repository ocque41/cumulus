// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest';
import {
  assertPlanCanApply,
  compileDatabaseManifest,
  createDatabaseApplyFailure,
  createDatabaseApproval,
  createDatabasePlan,
  createDatabaseRestorePlan,
  executeDatabasePlan,
  inspectPostgresDatabase,
  normalizeDatabaseState,
  restoreDatabaseSnapshot,
  verifyDatabaseAuditChain,
  type CumulusDatabaseState,
  type NimbusDatabaseManifest,
  type PostgresQueryClient,
} from '../database-transaction.js';

const manifest: NimbusDatabaseManifest = {
  apiVersion: 'nimbus.db/v0.1',
  kind: 'DatabaseManifest',
  metadata: {
    name: 'customer-core',
    workspace: 'demo',
  },
  target: {
    engine: 'postgres',
    database: 'app',
    environment: 'dev',
  },
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
  policies: {
    destructiveChanges: 'require_approval',
    snapshotBefore: ['destructive', 'irreversible', 'high'],
  },
};

function currentState(): CumulusDatabaseState {
  return normalizeDatabaseState({
    target: {
      engine: 'postgres',
      database: 'app',
      environment: 'dev',
    },
    schemas: [{ id: 'schema.public', name: 'public' }],
    tables: [
      {
        id: 'table.public.users',
        schema: 'public',
        name: 'users',
        columns: [
          {
            id: 'column.public.users.id',
            name: 'id',
            type: 'uuid',
            nullable: false,
            primaryKey: true,
            unique: false,
            default: null,
          },
          {
            id: 'column.public.users.email',
            name: 'email',
            type: 'text',
            nullable: false,
            primaryKey: false,
            unique: true,
            default: null,
          },
          {
            id: 'column.public.users.legacy_code',
            name: 'legacy_code',
            type: 'text',
            nullable: true,
            primaryKey: false,
            unique: false,
            default: null,
          },
        ],
        indexes: [],
      },
    ],
  });
}

describe('Nimbus database transaction MVP', () => {
  it('plans, gates, snapshots, applies, audits, and restores the first database demo', () => {
    const ir = compileDatabaseManifest(manifest);
    const plan = createDatabasePlan({ ir, currentState: currentState() });

    expect(ir.hash).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(plan.steps.map((step) => [step.op, step.risk.level])).toEqual([
      ['add_column', 'R1_SAFE_ADDITIVE'],
      ['drop_column', 'R5_DESTRUCTIVE'],
    ]);
    expect(plan.summary).toMatchObject({
      creates: 1,
      drops: 1,
      destructive: 1,
      highestRisk: 'R5_DESTRUCTIVE',
      approvalRequired: true,
      snapshotRequired: true,
    });

    expect(() => executeDatabasePlan({ plan, currentState: currentState() })).toThrow('APPROVAL_REQUIRED');

    const approval = createDatabaseApproval(plan, {
      principalId: 'user_123',
      type: 'human',
      scopes: ['cumulus.plan.read', 'cumulus.apply', 'cumulus.approve.destructive'],
      reason: 'Approved for dev fixture reset',
      now: '2026-05-23T12:00:00.000Z',
    });
    const applied = executeDatabasePlan({
      plan,
      currentState: currentState(),
      approval,
      actor: { principalId: 'user_123', kind: 'human' },
      now: '2026-05-23T12:01:00.000Z',
    });

    expect(applied.applyRun.status).toBe('succeeded');
    expect(applied.snapshot?.reason).toBe('pre_destructive_apply');
    expect(verifyDatabaseAuditChain(applied.audit)).toBe(true);
    expect(applied.audit.map((event) => event.eventType)).toEqual([
      'apply.started',
      'snapshot.created',
      'apply.step.started',
      'apply.step.completed',
      'apply.step.started',
      'apply.step.completed',
      'apply.completed',
    ]);

    const finalColumns = applied.state.tables[0]?.columns.map((column) => column.name).sort();
    expect(finalColumns).toEqual(['display_name', 'email', 'id']);

    const restored = restoreDatabaseSnapshot(applied.snapshot!);
    expect(restored.tables[0]?.columns.map((column) => column.name).sort()).toEqual(['email', 'id', 'legacy_code']);
  });

  it('creates a no-op plan when desired and current state match', () => {
    const noOpManifest: NimbusDatabaseManifest = {
      ...manifest,
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'text', nullable: false, unique: true },
              { name: 'legacy_code', type: 'text', nullable: true },
            ],
          },
        ],
      },
    };
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(noOpManifest), currentState: currentState() });
    const applied = executeDatabasePlan({ plan, currentState: currentState() });

    expect(plan.steps.map((step) => step.op)).toEqual(['noop']);
    expect(plan.summary).toMatchObject({ highestRisk: 'R0_NOOP', approvalRequired: false, snapshotRequired: false });
    expect(applied.applyRun.status).toBe('succeeded');
    expect(applied.snapshot).toBeNull();
  });

  it('refuses drifted state, expired approvals, and mismatched approval hashes', () => {
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(manifest), currentState: currentState() });
    const approval = createDatabaseApproval(plan, {
      principalId: 'user_123',
      reason: 'Approve destructive dev fixture change',
      now: '2026-05-23T12:00:00.000Z',
    });
    const drifted = normalizeDatabaseState({
      ...currentState(),
      tables: [
        {
          ...currentState().tables[0]!,
          columns: currentState().tables[0]!.columns.filter((column) => column.name !== 'legacy_code'),
        },
      ],
    });

    expect(() => assertPlanCanApply(plan, drifted, approval, '2026-05-23T12:01:00.000Z')).toThrow('STATE_DRIFTED');
    expect(() =>
      assertPlanCanApply(
        plan,
        currentState(),
        {
          ...approval,
          expiresAt: '2026-05-23T12:00:30.000Z',
        },
        '2026-05-23T12:01:00.000Z',
      ),
    ).toThrow('APPROVAL_EXPIRED');
    expect(() =>
      assertPlanCanApply(
        plan,
        currentState(),
        {
          ...approval,
          planHash: 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
        },
        '2026-05-23T12:01:00.000Z',
      ),
    ).toThrow('APPROVAL_PLAN_HASH_MISMATCH');
  });

  it('creates failed apply runs with apply.failed audit records', () => {
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(manifest), currentState: currentState() });
    const failure = createDatabaseApplyFailure({
      plan,
      currentState: currentState(),
      error: new Error('APPROVAL_REQUIRED: this plan requires approval'),
      actor: { principalId: 'agent_123', kind: 'agent' },
      now: '2026-05-23T12:00:00.000Z',
    });

    expect(failure.applyRun).toMatchObject({
      planId: plan.planId,
      status: 'failed',
      snapshotId: null,
      error: { code: 'APPROVAL_REQUIRED' },
    });
    expect(failure.state.fingerprint).toBe(currentState().fingerprint);
    expect(failure.snapshot).toBeNull();
    expect(failure.audit.map((event) => event.eventType)).toEqual(['apply.started', 'apply.failed']);
    expect(verifyDatabaseAuditChain(failure.audit)).toBe(true);
  });

  it('classifies raw SQL as unknown and requires an admin override scope', () => {
    const rawSqlManifest: NimbusDatabaseManifest = {
      ...manifest,
      resources: {
        schemas: [{ name: 'public' }],
        rawSql: ['drop schema public cascade;'],
      },
    };
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(rawSqlManifest), currentState: currentState() });
    const rawSqlStep = plan.steps.find((step) => step.op === 'raw_sql_blocked_by_default');

    expect(plan.summary.highestRisk).toBe('R6_IRREVERSIBLE_OR_UNKNOWN');
    expect(rawSqlStep?.risk.categories).toContain('unknown');
    expect(() =>
      createDatabaseApproval(plan, {
        principalId: 'user_123',
        scopes: ['cumulus.plan.read', 'cumulus.apply', 'cumulus.approve.destructive'],
        reason: 'Missing admin override',
      }),
    ).toThrow('cumulus.approve.admin_override');
  });

  it('applies logical column type and nullability changes', () => {
    const alterManifest: NimbusDatabaseManifest = {
      ...manifest,
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'varchar(320)', nullable: true, unique: true },
              { name: 'legacy_code', type: 'text', nullable: true },
            ],
          },
        ],
      },
    };
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(alterManifest), currentState: currentState() });
    const approval = createDatabaseApproval(plan, {
      principalId: 'user_123',
      reason: 'Approve data-dependent fixture change',
    });
    const applied = executeDatabasePlan({ plan, currentState: currentState(), approval });
    const email = applied.state.tables[0]?.columns.find((column) => column.name === 'email');

    expect(plan.steps.map((step) => step.op)).toEqual(['alter_column_type', 'alter_column_nullable']);
    expect(email).toMatchObject({ type: 'varchar(320)', nullable: true });
  });

  it('plans and applies explicit table and column renames', () => {
    const renameManifest: NimbusDatabaseManifest = {
      ...manifest,
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'customers',
            renameFrom: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'text', nullable: false, unique: true },
              { name: 'external_code', renameFrom: 'legacy_code', type: 'text', nullable: true },
            ],
          },
        ],
      },
    };
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(renameManifest), currentState: currentState() });
    const approval = createDatabaseApproval(plan, {
      principalId: 'user_123',
      reason: 'Approve compatibility rename fixture',
    });
    const applied = executeDatabasePlan({ plan, currentState: currentState(), approval });

    expect(plan.steps.map((step) => step.op)).toEqual(['rename_table', 'rename_column']);
    expect(plan.steps.map((step) => step.sql)).toEqual([
      'alter table "public"."users" rename to "customers";',
      'alter table "public"."customers" rename column "legacy_code" to "external_code";',
    ]);
    expect(plan.summary.highestRisk).toBe('R4_BACKWARD_INCOMPATIBLE');
    expect(applied.state.tables[0]?.name).toBe('customers');
    expect(applied.state.tables[0]?.columns.map((column) => column.name).sort()).toEqual(['email', 'external_code', 'id']);
  });

  it('plans unique new columns without duplicating inline unique SQL', () => {
    const uniqueManifest: NimbusDatabaseManifest = {
      ...manifest,
      resources: {
        schemas: [{ name: 'public' }],
        tables: [
          {
            schema: 'public',
            name: 'users',
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'email', type: 'text', nullable: false, unique: true },
              { name: 'legacy_code', type: 'text', nullable: true },
              { name: 'username', type: 'text', nullable: true, unique: true },
            ],
          },
        ],
      },
    };
    const plan = createDatabasePlan({ ir: compileDatabaseManifest(uniqueManifest), currentState: currentState() });

    expect(plan.steps.map((step) => step.op)).toEqual(['add_column', 'add_unique_constraint']);
    expect(plan.steps[0]?.sql).toBe('alter table "public"."users" add column "username" text;');
    expect(plan.steps[1]?.sql).toBe('alter table "public"."users" add constraint "users_username_uniq" unique ("username");');
  });

  it('generates snapshot restore plans with drop indexes before dropped columns', () => {
    const current = normalizeDatabaseState({
      ...currentState(),
      tables: [
        {
          ...currentState().tables[0]!,
          columns: [
            ...currentState().tables[0]!.columns,
            {
              id: 'column.public.users.display_name',
              name: 'display_name',
              type: 'text',
              nullable: true,
              primaryKey: false,
              unique: false,
              default: null,
            },
          ],
          indexes: [
            {
              id: 'index.public.users.users_display_name_idx',
              name: 'users_display_name_idx',
              columns: ['display_name'],
              unique: false,
            },
          ],
        },
      ],
    });
    const snapshotState = normalizeDatabaseState({
      ...current,
      tables: [
        {
          ...current.tables[0]!,
          columns: current.tables[0]!.columns.filter((column) => column.name !== 'display_name'),
          indexes: [],
        },
      ],
    });
    const snapshot = {
      snapshotId: 'snap_restorefixture',
      target: snapshotState.target,
      provider: 'postgres.logical_state.v0' as const,
      reason: 'pre_destructive_apply' as const,
      planId: 'plan_fixture',
      createdAt: '2026-05-23T12:00:00.000Z',
      verified: true,
      stateFingerprint: snapshotState.fingerprint,
      state: snapshotState,
    };
    const plan = createDatabaseRestorePlan({ snapshot, currentState: current });

    expect(plan.steps.map((step) => step.op)).toEqual(['drop_index', 'drop_column']);
    expect(plan.steps.map((step) => step.sql)).toEqual([
      'drop index "public"."users_display_name_idx";',
      'alter table "public"."users" drop column "display_name";',
    ]);
  });

  it('inspects a Postgres information_schema fixture into comparable current state', async () => {
    const client: PostgresQueryClient = {
      async query<T extends Record<string, unknown> = Record<string, unknown>>(sql: string): Promise<{ rows: T[] }> {
        if (sql.includes('information_schema.schemata')) {
          return { rows: [{ schema_name: 'public' }] as unknown as T[] };
        }
        if (sql.includes('information_schema.tables')) {
          return { rows: [{ table_schema: 'public', table_name: 'users' }] as unknown as T[] };
        }
        if (sql.includes('information_schema.columns')) {
          return {
            rows: [
              {
                table_schema: 'public',
                table_name: 'users',
                column_name: 'id',
                data_type: 'uuid',
                udt_name: 'uuid',
                is_nullable: 'NO',
                column_default: null,
                ordinal_position: 1,
              },
              {
                table_schema: 'public',
                table_name: 'users',
                column_name: 'email',
                data_type: 'text',
                udt_name: 'text',
                is_nullable: 'NO',
                column_default: null,
                ordinal_position: 2,
              },
            ] as unknown as T[],
          };
        }
        if (sql.includes('pg_class tbl')) {
          return { rows: [] };
        }
        return {
          rows: [
            {
              table_schema: 'public',
              table_name: 'users',
              column_name: 'id',
              constraint_type: 'PRIMARY KEY',
              constraint_name: 'users_pkey',
            },
            {
              table_schema: 'public',
              table_name: 'users',
              column_name: 'email',
              constraint_type: 'UNIQUE',
              constraint_name: 'users_email_key',
            },
          ] as unknown as T[],
        };
      },
    };

    const state = await inspectPostgresDatabase(client, { engine: 'postgres', database: 'app' }, { schemas: ['public'] });

    expect(state.fingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(state.tables[0]?.columns).toEqual([
      {
        id: 'column.public.users.email',
        name: 'email',
        type: 'text',
        nullable: false,
        primaryKey: false,
        unique: true,
        default: null,
      },
      {
        id: 'column.public.users.id',
        name: 'id',
        type: 'uuid',
        nullable: false,
        primaryKey: true,
        unique: false,
        default: null,
      },
    ]);
  });
});
