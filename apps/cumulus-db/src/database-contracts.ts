// SPDX-License-Identifier: AGPL-3.0-only

const hashSchema = { type: 'string', pattern: '^sha256:[a-f0-9]{64}$' } as const;
const dateTimeSchema = { type: 'string', format: 'date-time' } as const;

const databaseTargetSchema = {
  type: 'object',
  required: ['engine', 'database'],
  properties: {
    engine: { const: 'postgres' },
    database: { type: 'string', minLength: 1 },
    environment: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const databaseColumnInputSchema = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string', minLength: 1 },
    renameFrom: { type: 'string', minLength: 1 },
    type: { type: 'string', minLength: 1 },
    nullable: { type: 'boolean' },
    primaryKey: { type: 'boolean' },
    unique: { type: 'boolean' },
    default: { type: 'string' },
  },
  additionalProperties: false,
} as const;

const databaseIndexInputSchema = {
  type: 'object',
  required: ['columns'],
  properties: {
    name: { type: 'string', minLength: 1 },
    columns: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
    unique: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

const databaseTableInputSchema = {
  type: 'object',
  required: ['name', 'columns'],
  properties: {
    schema: { type: 'string', minLength: 1, default: 'public' },
    name: { type: 'string', minLength: 1 },
    renameFrom: {
      anyOf: [
        { type: 'string', minLength: 1 },
        {
          type: 'object',
          required: ['name'],
          properties: {
            schema: { type: 'string', minLength: 1 },
            name: { type: 'string', minLength: 1 },
          },
          additionalProperties: false,
        },
      ],
    },
    columns: { type: 'array', minItems: 1, items: databaseColumnInputSchema },
    indexes: { type: 'array', items: databaseIndexInputSchema },
  },
  additionalProperties: false,
} as const;

const databaseSchemaSchema = {
  type: 'object',
  required: ['id', 'name'],
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const databaseColumnSchema = {
  type: 'object',
  required: ['id', 'name', 'type', 'nullable', 'primaryKey', 'unique', 'default'],
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    renameFrom: { type: 'string', minLength: 1 },
    type: { type: 'string', minLength: 1 },
    nullable: { type: 'boolean' },
    primaryKey: { type: 'boolean' },
    unique: { type: 'boolean' },
    default: { type: ['string', 'null'] },
  },
  additionalProperties: false,
} as const;

const databaseIndexSchema = {
  type: 'object',
  required: ['id', 'name', 'columns', 'unique'],
  properties: {
    id: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    columns: { type: 'array', minItems: 1, items: { type: 'string', minLength: 1 } },
    unique: { type: 'boolean' },
  },
  additionalProperties: false,
} as const;

const databaseTableSchema = {
  type: 'object',
  required: ['id', 'schema', 'name', 'columns', 'indexes'],
  properties: {
    id: { type: 'string', minLength: 1 },
    schema: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    renameFrom: {
      type: 'object',
      required: ['schema', 'name'],
      properties: {
        schema: { type: 'string', minLength: 1 },
        name: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
    columns: { type: 'array', items: databaseColumnSchema },
    indexes: { type: 'array', items: databaseIndexSchema },
  },
  additionalProperties: false,
} as const;

const databaseRiskLevelSchema = {
  enum: [
    'R0_NOOP',
    'R1_SAFE_ADDITIVE',
    'R2_OPERATIONAL',
    'R3_DATA_DEPENDENT',
    'R4_BACKWARD_INCOMPATIBLE',
    'R5_DESTRUCTIVE',
    'R6_IRREVERSIBLE_OR_UNKNOWN',
  ],
} as const;

const databaseOperationSchema = {
  enum: [
    'noop',
    'create_schema',
    'create_table',
    'add_column',
    'alter_column_nullable',
    'alter_column_type',
    'add_index',
    'add_unique_constraint',
    'drop_index',
    'drop_column',
    'drop_table',
    'rename_column',
    'rename_table',
    'raw_sql_blocked_by_default',
  ],
} as const;

const databaseStateSchema = {
  type: 'object',
  required: ['target', 'schemas', 'tables', 'fingerprint'],
  properties: {
    target: databaseTargetSchema,
    schemas: { type: 'array', items: databaseSchemaSchema },
    tables: { type: 'array', items: databaseTableSchema },
    fingerprint: hashSchema,
  },
  additionalProperties: false,
} as const;

const databaseRiskSchema = {
  type: 'object',
  required: ['level', 'categories', 'requiresApproval', 'snapshotRequired', 'reason'],
  properties: {
    level: databaseRiskLevelSchema,
    categories: { type: 'array', items: { type: 'string', minLength: 1 } },
    requiresApproval: { type: 'boolean' },
    snapshotRequired: { type: 'boolean' },
    reason: { type: 'string', minLength: 1 },
  },
  additionalProperties: false,
} as const;

const databasePlanStepSchema = {
  type: 'object',
  required: ['stepId', 'op', 'object', 'sql', 'risk'],
  properties: {
    stepId: { type: 'string', minLength: 1 },
    op: databaseOperationSchema,
    object: { type: 'string', minLength: 1 },
    sql: { type: ['string', 'null'] },
    risk: databaseRiskSchema,
    details: {
      type: 'object',
      properties: {
        table: databaseTableSchema,
        column: databaseColumnSchema,
        index: databaseIndexSchema,
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export const nimbusDatabaseManifestJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/nimbus-db-manifest/v0.schema.json',
  type: 'object',
  required: ['apiVersion', 'kind', 'metadata', 'target', 'resources'],
  properties: {
    apiVersion: { const: 'nimbus.db/v0.1' },
    kind: { const: 'DatabaseManifest' },
    metadata: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1 },
        workspace: { type: 'string', minLength: 1 },
      },
      additionalProperties: false,
    },
    target: databaseTargetSchema,
    resources: {
      type: 'object',
      properties: {
        schemas: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name'],
            properties: { name: { type: 'string', minLength: 1 } },
            additionalProperties: false,
          },
        },
        tables: { type: 'array', items: databaseTableInputSchema },
        rawSql: { type: 'array', items: { type: 'string', minLength: 1 } },
      },
      additionalProperties: false,
    },
    policies: {
      type: 'object',
      properties: {
        destructiveChanges: { enum: ['block', 'require_approval'] },
        snapshotBefore: {
          type: 'array',
          items: { enum: ['destructive', 'irreversible', 'high'] },
        },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const;

export const nimbusDatabaseIrJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/nimbus-db-ir/v0.schema.json',
  type: 'object',
  required: ['irVersion', 'manifestHash', 'metadata', 'target', 'resources', 'policies', 'hash'],
  properties: {
    irVersion: { const: 'nimbus.db.ir/v0.1' },
    manifestHash: hashSchema,
    metadata: nimbusDatabaseManifestJsonSchemaContract.properties.metadata,
    target: databaseTargetSchema,
    resources: {
      type: 'object',
      required: ['schemas', 'tables', 'rawSql'],
      properties: {
        schemas: { type: 'array', items: databaseSchemaSchema },
        tables: { type: 'array', items: databaseTableSchema },
        rawSql: { type: 'array', items: { type: 'string' } },
      },
      additionalProperties: false,
    },
    policies: {
      type: 'object',
      required: ['destructiveChanges', 'snapshotBefore'],
      properties: {
        destructiveChanges: { enum: ['block', 'require_approval'] },
        snapshotBefore: {
          type: 'array',
          items: { enum: ['destructive', 'irreversible', 'high'] },
        },
      },
      additionalProperties: false,
    },
    hash: hashSchema,
  },
  additionalProperties: false,
} as const;

export const cumulusDatabasePlanJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/cumulus-db-plan/v0.schema.json',
  type: 'object',
  required: [
    'planId',
    'planVersion',
    'manifestHash',
    'irHash',
    'target',
    'currentStateFingerprint',
    'riskPolicyVersion',
    'steps',
    'summary',
    'planHash',
  ],
  properties: {
    planId: { type: 'string', pattern: '^plan_[A-Za-z0-9]+$' },
    planVersion: { const: 'cumulus.plan/v0.1' },
    manifestHash: hashSchema,
    irHash: hashSchema,
    target: databaseTargetSchema,
    currentStateFingerprint: hashSchema,
    riskPolicyVersion: { const: 'risk.policy/v0.1' },
    steps: { type: 'array', items: databasePlanStepSchema },
    summary: {
      type: 'object',
      required: ['creates', 'updates', 'drops', 'destructive', 'highestRisk', 'approvalRequired', 'snapshotRequired'],
      properties: {
        creates: { type: 'integer', minimum: 0 },
        updates: { type: 'integer', minimum: 0 },
        drops: { type: 'integer', minimum: 0 },
        destructive: { type: 'integer', minimum: 0 },
        highestRisk: databaseRiskLevelSchema,
        approvalRequired: { type: 'boolean' },
        snapshotRequired: { type: 'boolean' },
      },
      additionalProperties: false,
    },
    planHash: hashSchema,
  },
  additionalProperties: false,
} as const;

export const databaseApprovalJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/cumulus-db-approval/v0.schema.json',
  type: 'object',
  required: ['approvalId', 'planId', 'planHash', 'decision', 'approvedBy', 'requiredScopes', 'reason', 'expiresAt', 'createdAt'],
  properties: {
    approvalId: { type: 'string', pattern: '^appr_[A-Za-z0-9]+$' },
    planId: { type: 'string', minLength: 1 },
    planHash: hashSchema,
    decision: { const: 'approved' },
    approvedBy: {
      type: 'object',
      required: ['principalId', 'type'],
      properties: {
        principalId: { type: 'string', minLength: 1 },
        type: { enum: ['human', 'agent', 'system'] },
      },
      additionalProperties: false,
    },
    requiredScopes: { type: 'array', items: { type: 'string', minLength: 1 } },
    reason: { type: 'string', minLength: 1 },
    expiresAt: dateTimeSchema,
    createdAt: dateTimeSchema,
  },
  additionalProperties: false,
} as const;

export const databaseSnapshotJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/cumulus-db-snapshot/v0.schema.json',
  type: 'object',
  required: ['snapshotId', 'target', 'provider', 'reason', 'planId', 'createdAt', 'verified', 'stateFingerprint', 'state'],
  properties: {
    snapshotId: { type: 'string', pattern: '^snap_[A-Za-z0-9]+$' },
    target: databaseTargetSchema,
    provider: { const: 'postgres.logical_state.v0' },
    reason: { enum: ['pre_destructive_apply', 'manual', 'revert_point'] },
    planId: { type: ['string', 'null'] },
    createdAt: dateTimeSchema,
    verified: { type: 'boolean' },
    stateFingerprint: hashSchema,
    state: databaseStateSchema,
  },
  additionalProperties: false,
} as const;

export const databaseAuditEventJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/cumulus-db-audit-event/v0.schema.json',
  type: 'object',
  required: ['auditId', 'sequence', 'eventType', 'actor', 'target', 'subject', 'timestamp', 'prevHash', 'eventHash'],
  properties: {
    auditId: { type: 'string', pattern: '^aud_[A-Za-z0-9]+$' },
    sequence: { type: 'integer', minimum: 1 },
    eventType: { type: 'string', minLength: 1 },
    actor: {
      type: 'object',
      required: ['principalId', 'kind'],
      properties: {
        principalId: { type: 'string', minLength: 1 },
        kind: { enum: ['human', 'agent', 'system'] },
      },
      additionalProperties: false,
    },
    target: databaseTargetSchema,
    subject: { type: 'object', additionalProperties: true },
    decision: { type: 'object', additionalProperties: true },
    timestamp: dateTimeSchema,
    prevHash: { anyOf: [hashSchema, { type: 'null' }] },
    eventHash: hashSchema,
  },
  additionalProperties: false,
} as const;

export const databaseStateJsonSchemaContract = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://schemas.cumulus.sh/cumulus-db-state/v0.schema.json',
  ...databaseStateSchema,
} as const;
