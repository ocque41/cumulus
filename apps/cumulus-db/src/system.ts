// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, randomUUID } from 'node:crypto';
import { canonicalStringify, type NimbusIr } from './nimbus.js';
import type { TokenScope } from './types.js';

export type PrincipalType = 'human' | 'agent' | 'app' | 'system';
export type SchemaRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'destructive';

export interface SystemPrincipal {
  id: string;
  type: PrincipalType;
  displayName: string;
  status: 'active' | 'disabled' | 'pending_claim';
  createdAt: string;
  lastSeenAt: string | null;
  grants: TokenScope[];
}

export interface SystemApproval {
  id: string;
  tokenHash: string;
  planId: string;
  planHash: string;
  scope: TokenScope;
  createdAt: string;
  expiresAt: string;
  usedAt: string | null;
  actorType: PrincipalType;
  actorId: string;
  targetVersionId?: string | null;
  targetSnapshotId?: string | null;
}

export interface SchemaOperation {
  kind:
    | 'create_collection'
    | 'drop_collection'
    | 'add_field'
    | 'drop_field'
    | 'alter_field'
    | 'add_secret'
    | 'remove_secret'
    | 'add_index'
    | 'remove_index'
    | 'noop';
  target: string;
  risk: SchemaRiskLevel;
  summary: string;
}

export interface SchemaPlanRecord {
  id: string;
  planHash: string;
  desiredHash: string;
  desired: NimbusIr;
  operations: SchemaOperation[];
  riskLevel: SchemaRiskLevel;
  status: 'planned' | 'applied' | 'rejected';
  createdAt: string;
  appliedAt: string | null;
  approvalRequired: boolean;
  snapshotRequired: boolean;
  baseLiveHash: string | null;
  baseLastAppliedHash: string | null;
}

export interface SchemaVersionRecord {
  id: string;
  desiredHash: string;
  canonicalJson: NimbusIr;
  planId: string;
  planHash: string;
  riskLevel: SchemaRiskLevel;
  applyStatus: 'applied' | 'failed' | 'reverted';
  createdAt: string;
  appliedAt: string;
  revertedAt?: string;
}

export interface SystemSnapshotRecord {
  id: string;
  kind: 'pre_apply' | 'manual' | 'revert_point';
  path: string;
  createdAt: string;
  createdByType: PrincipalType;
  createdById: string;
  metadata: Record<string, unknown>;
}

export interface SystemState {
  version: 1;
  org: {
    id: string;
    slug: string;
    name: string;
    status: 'active' | 'suspended' | 'pending_claim';
    humanOwnerEmail: string | null;
    createdAt: string;
    claimedAt: string | null;
  };
  principals: SystemPrincipal[];
  approvals: SystemApproval[];
  schema: {
    live: NimbusIr | null;
    liveHash: string | null;
    lastApplied: NimbusIr | null;
    lastAppliedHash: string | null;
    plans: SchemaPlanRecord[];
    versions: SchemaVersionRecord[];
    snapshots: SystemSnapshotRecord[];
  };
}

export const LEGACY_TOKEN_SCOPES: TokenScope[] = [
  'records:read',
  'records:write',
  'search:read',
  'events:write',
  'kv:read',
  'kv:write',
  'secrets:write',
  'secrets:reveal',
  'tokens:manage',
  'backups:manage',
  'database:admin',
];

export const SYSTEM_SCOPE_REGISTRY: Array<{
  scope: TokenScope;
  label: string;
  dangerous: boolean;
  approvalRequired: boolean;
}> = [
  { scope: 'system:read', label: 'View system state', dangerous: false, approvalRequired: false },
  { scope: 'audit:read', label: 'View audit logs', dangerous: false, approvalRequired: false },
  { scope: 'org:read', label: 'View organization', dangerous: false, approvalRequired: false },
  { scope: 'org:claim', label: 'Claim organization', dangerous: true, approvalRequired: true },
  { scope: 'member:invite', label: 'Invite members', dangerous: false, approvalRequired: false },
  { scope: 'member:approve', label: 'Approve members and plans', dangerous: true, approvalRequired: true },
  { scope: 'member:revoke', label: 'Revoke members', dangerous: true, approvalRequired: true },
  { scope: 'agent:create', label: 'Create agents', dangerous: false, approvalRequired: false },
  { scope: 'agent:disable', label: 'Disable agents', dangerous: true, approvalRequired: true },
  { scope: 'app:create', label: 'Create apps', dangerous: false, approvalRequired: false },
  { scope: 'app:update', label: 'Update apps', dangerous: false, approvalRequired: false },
  { scope: 'token:create', label: 'Create tokens', dangerous: false, approvalRequired: false },
  { scope: 'token:rotate_self', label: 'Rotate own token', dangerous: false, approvalRequired: false },
  { scope: 'token:revoke_any', label: 'Revoke any token', dangerous: true, approvalRequired: true },
  { scope: 'schema:read', label: 'Read schema', dangerous: false, approvalRequired: false },
  { scope: 'schema:plan', label: 'Plan schema changes', dangerous: false, approvalRequired: false },
  { scope: 'schema:apply_safe', label: 'Apply safe schema changes', dangerous: false, approvalRequired: false },
  { scope: 'schema:apply_destructive', label: 'Apply destructive schema changes', dangerous: true, approvalRequired: true },
  { scope: 'schema:revert_local', label: 'Revert local state', dangerous: true, approvalRequired: true },
  { scope: 'schema:revert_cloud', label: 'Revert cloud state', dangerous: true, approvalRequired: true },
  { scope: 'data:read', label: 'Read app data', dangerous: false, approvalRequired: false },
  { scope: 'data:write', label: 'Write app data', dangerous: false, approvalRequired: false },
  { scope: 'data:delete_soft', label: 'Soft-delete data', dangerous: true, approvalRequired: true },
  { scope: 'data:delete_hard', label: 'Hard-delete data', dangerous: true, approvalRequired: true },
  { scope: 'secret:read', label: 'Read secret handles', dangerous: true, approvalRequired: true },
  { scope: 'secret:write', label: 'Write secret handles', dangerous: true, approvalRequired: true },
  { scope: 'backup:create', label: 'Create backups', dangerous: false, approvalRequired: false },
  { scope: 'backup:restore', label: 'Restore backups', dangerous: true, approvalRequired: true },
  { scope: 'billing:read', label: 'View billing', dangerous: false, approvalRequired: false },
  { scope: 'billing:write', label: 'Update billing', dangerous: true, approvalRequired: true },
  { scope: 'org:destroy', label: 'Destroy organization', dangerous: true, approvalRequired: true },
];

export const ALL_TOKEN_SCOPES: TokenScope[] = [...LEGACY_TOKEN_SCOPES, ...SYSTEM_SCOPE_REGISTRY.map((item) => item.scope)];

export const DEFAULT_AGENT_SYSTEM_SCOPES: TokenScope[] = [
  'system:read',
  'org:read',
  'schema:read',
  'schema:plan',
  'token:rotate_self',
];

export const DEFAULT_OWNER_SYSTEM_SCOPES: TokenScope[] = [
  'system:read',
  'audit:read',
  'org:read',
  'org:claim',
  'member:invite',
  'member:approve',
  'member:revoke',
  'agent:create',
  'agent:disable',
  'app:create',
  'app:update',
  'token:create',
  'token:rotate_self',
  'token:revoke_any',
  'schema:read',
  'schema:plan',
  'schema:apply_safe',
  'schema:apply_destructive',
  'schema:revert_local',
  'data:read',
  'data:write',
  'backup:create',
  'billing:read',
];

export function normalizeTokenScopes(scopes: string[]): TokenScope[] {
  const known = new Set<TokenScope>(ALL_TOKEN_SCOPES);
  const normalized = [...new Set(scopes)].filter((scope): scope is TokenScope => known.has(scope as TokenScope));
  if (normalized.length !== scopes.length) {
    const invalid = scopes.filter((scope) => !known.has(scope as TokenScope));
    throw new Error(`unknown token scope: ${invalid.join(', ')}`);
  }
  return normalized;
}

export function isHardSystemScope(scope: TokenScope): boolean {
  return SYSTEM_SCOPE_REGISTRY.some((item) => item.scope === scope);
}

export function riskRank(risk: SchemaRiskLevel): number {
  return { none: 0, low: 1, medium: 2, high: 3, destructive: 4 }[risk];
}

export function maxRisk(operations: SchemaOperation[]): SchemaRiskLevel {
  return operations.reduce<SchemaRiskLevel>((current, operation) => {
    return riskRank(operation.risk) > riskRank(current) ? operation.risk : current;
  }, 'none');
}

export function newSystemState(input: {
  dbId: string;
  ownerAgentId: string;
  humanOwnerEmail: string | null;
  createdAt: string;
}): SystemState {
  return {
    version: 1,
    org: {
      id: `org_${input.dbId.replace(/^db_/, '')}`,
      slug: input.dbId,
      name: 'Cumulus workspace',
      status: input.humanOwnerEmail ? 'active' : 'pending_claim',
      humanOwnerEmail: input.humanOwnerEmail,
      createdAt: input.createdAt,
      claimedAt: input.humanOwnerEmail ? input.createdAt : null,
    },
    principals: [
      {
        id: input.ownerAgentId,
        type: 'agent',
        displayName: input.ownerAgentId,
        status: input.humanOwnerEmail ? 'active' : 'pending_claim',
        createdAt: input.createdAt,
        lastSeenAt: null,
        grants: DEFAULT_AGENT_SYSTEM_SCOPES,
      },
    ],
    approvals: [],
    schema: {
      live: null,
      liveHash: null,
      lastApplied: null,
      lastAppliedHash: null,
      plans: [],
      versions: [],
      snapshots: [],
    },
  };
}

export function buildSchemaPlan(input: {
  desired: NimbusIr;
  desiredHash: string;
  live: NimbusIr | null;
  lastApplied: NimbusIr | null;
  createdAt: string;
}): SchemaPlanRecord {
  const operations = diffNimbus(input.desired, input.live);
  const riskLevel = maxRisk(operations);
  const planHash = stableHash({
    desiredHash: input.desiredHash,
    liveHash: input.live ? stableHash(input.live) : null,
    lastAppliedHash: input.lastApplied ? stableHash(input.lastApplied) : null,
    operations,
  });
  return {
    id: `plan_${randomUUID().replace(/-/g, '')}`,
    planHash,
    desiredHash: input.desiredHash,
    desired: input.desired,
    operations,
    riskLevel,
    status: 'planned',
    createdAt: input.createdAt,
    appliedAt: null,
    approvalRequired: riskLevel === 'destructive',
    snapshotRequired: riskRank(riskLevel) >= riskRank('medium'),
    baseLiveHash: input.live ? stableHash(input.live) : null,
    baseLastAppliedHash: input.lastApplied ? stableHash(input.lastApplied) : null,
  };
}

export function stableHash(value: unknown): string {
  return `sha256:${createHash('sha256').update(canonicalStringify(value)).digest('hex')}`;
}

function diffNimbus(desired: NimbusIr, live: NimbusIr | null): SchemaOperation[] {
  if (!live) {
    const operations = desired.spec.collections.map<SchemaOperation>((collection) => ({
      kind: 'create_collection',
      target: `collection.${collection.name}`,
      risk: 'low',
      summary: `Create collection ${collection.name}`,
    }));
    return operations.length ? operations : [{ kind: 'noop', target: desired.spec.namespace, risk: 'none', summary: 'No schema changes' }];
  }

  const operations: SchemaOperation[] = [];
  const liveCollections = new Map(live.spec.collections.map((collection) => [collection.name, collection]));
  const desiredCollections = new Map(desired.spec.collections.map((collection) => [collection.name, collection]));

  for (const [name, collection] of desiredCollections) {
    const current = liveCollections.get(name);
    if (!current) {
      operations.push({ kind: 'create_collection', target: `collection.${name}`, risk: 'low', summary: `Create collection ${name}` });
      continue;
    }
    const currentFields = new Set(Object.keys(current.fields));
    const desiredFields = new Set(Object.keys(collection.fields));
    for (const field of desiredFields) {
      if (!currentFields.has(field)) {
        operations.push({ kind: 'add_field', target: `collection.${name}.field.${field}`, risk: 'low', summary: `Add field ${field} to ${name}` });
        continue;
      }
      if (canonicalStringify(current.fields[field]) !== canonicalStringify(collection.fields[field])) {
        operations.push({ kind: 'alter_field', target: `collection.${name}.field.${field}`, risk: 'medium', summary: `Change field ${field} on ${name}` });
      }
    }
    for (const field of currentFields) {
      if (!desiredFields.has(field)) {
        operations.push({ kind: 'drop_field', target: `collection.${name}.field.${field}`, risk: 'destructive', summary: `Drop field ${field} from ${name}` });
      }
    }
  }

  for (const name of liveCollections.keys()) {
    if (!desiredCollections.has(name)) {
      operations.push({ kind: 'drop_collection', target: `collection.${name}`, risk: 'destructive', summary: `Drop collection ${name}` });
    }
  }

  const liveSecrets = new Set(live.spec.secrets.map((secret) => secret.name));
  const desiredSecrets = new Set(desired.spec.secrets.map((secret) => secret.name));
  for (const secret of desiredSecrets) {
    if (!liveSecrets.has(secret)) {
      operations.push({ kind: 'add_secret', target: `secret.${secret}`, risk: 'medium', summary: `Add secret handle ${secret}` });
    }
  }
  for (const secret of liveSecrets) {
    if (!desiredSecrets.has(secret)) {
      operations.push({ kind: 'remove_secret', target: `secret.${secret}`, risk: 'high', summary: `Remove secret handle ${secret}` });
    }
  }

  return operations.length ? operations : [{ kind: 'noop', target: desired.spec.namespace, risk: 'none', summary: 'No schema changes' }];
}
