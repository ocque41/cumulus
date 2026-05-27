// SPDX-License-Identifier: AGPL-3.0-only
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  cumulusDatabasePlanJsonSchemaContract,
  databaseApprovalJsonSchemaContract,
  databaseAuditEventJsonSchemaContract,
  databaseSnapshotJsonSchemaContract,
  databaseStateJsonSchemaContract,
  nimbusDatabaseIrJsonSchemaContract,
  nimbusDatabaseManifestJsonSchemaContract,
  nimbusIrJsonSchemaContract,
  systemOpenApiContract,
} from '../contracts.js';
import { NIMBUS_API_VERSION, NIMBUS_IR_SCHEMA_ID, NIMBUS_KIND } from '../nimbus-schema.js';
import { SYSTEM_SCOPE_REGISTRY } from '../system.js';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(repoRoot, path), 'utf8')) as unknown;
}

describe('Nimbus machine contracts', () => {
  it('exports a static Nimbus IR JSON Schema file from the runtime contract', async () => {
    const file = await readJson('apps/cumulus-db/schemas/nimbus-ir-v1alpha1.schema.json');

    expect(file).toEqual(nimbusIrJsonSchemaContract);
    expect(nimbusIrJsonSchemaContract).toMatchObject({
      $id: NIMBUS_IR_SCHEMA_ID,
      properties: {
        apiVersion: { const: NIMBUS_API_VERSION },
        kind: { const: NIMBUS_KIND },
      },
    });
    expect(nimbusIrJsonSchemaContract.properties.spec.required).toEqual([
      'namespace',
      'apps',
      'collections',
      'indexes',
      'policies',
      'secrets',
      'backups',
      'approvals',
    ]);
  });

  it('exports static Nimbus database transaction schemas from runtime contracts', async () => {
    await expect(readJson('apps/cumulus-db/schemas/nimbus-db-manifest-v0.schema.json')).resolves.toEqual(
      nimbusDatabaseManifestJsonSchemaContract,
    );
    await expect(readJson('apps/cumulus-db/schemas/nimbus-db-ir-v0.schema.json')).resolves.toEqual(
      nimbusDatabaseIrJsonSchemaContract,
    );
    await expect(readJson('apps/cumulus-db/schemas/cumulus-db-plan-v0.schema.json')).resolves.toEqual(
      cumulusDatabasePlanJsonSchemaContract,
    );
    await expect(readJson('apps/cumulus-db/schemas/cumulus-db-approval-v0.schema.json')).resolves.toEqual(
      databaseApprovalJsonSchemaContract,
    );
    await expect(readJson('apps/cumulus-db/schemas/cumulus-db-snapshot-v0.schema.json')).resolves.toEqual(
      databaseSnapshotJsonSchemaContract,
    );
    await expect(readJson('apps/cumulus-db/schemas/cumulus-db-audit-event-v0.schema.json')).resolves.toEqual(
      databaseAuditEventJsonSchemaContract,
    );
    await expect(readJson('apps/cumulus-db/schemas/cumulus-db-state-v0.schema.json')).resolves.toEqual(
      databaseStateJsonSchemaContract,
    );
    expect(cumulusDatabasePlanJsonSchemaContract.properties.planVersion.const).toBe('cumulus.plan/v0.1');
    expect(nimbusDatabaseManifestJsonSchemaContract.properties.apiVersion.const).toBe('nimbus.db/v0.1');
  });

  it('exports an OpenAPI 3.1 system contract with current hard scopes', async () => {
    const file = await readJson('apps/cumulus-db/openapi/system-v1.openapi.json');
    const expectedScopes = SYSTEM_SCOPE_REGISTRY.map((item) => item.scope);

    expect(file).toEqual(systemOpenApiContract);
    expect(systemOpenApiContract.openapi).toBe('3.1.0');
    expect(Object.keys(systemOpenApiContract.paths)).toEqual([
      '/.well-known/openid-configuration',
      '/oauth/authorize',
      '/oauth/device_authorization',
      '/oauth/device_authorization/verify',
      '/oauth/token',
      '/oidc/userinfo',
      '/v1/system/scopes',
      '/v1/system/agents/bootstrap',
      '/v1/system/orgs/claim',
      '/v1/system/grants',
      '/v1/system/passkeys/step-up',
      '/v1/system/agents/{agentId}/disable',
      '/v1/system/agents/{agentId}/rotate',
      '/v1/system/agents/{agentId}/revoke',
      '/v1/system/state',
      '/v1/system/audit',
      '/v1/database/manifests:compile',
      '/v1/database/plans',
      '/v1/database/plans/{planId}',
      '/v1/database/plans:approve',
      '/v1/database/plans:apply',
      '/v1/database/snapshots',
      '/v1/database/snapshots:restore',
      '/v1/database/audit',
      '/v1/database/audit:verify',
      '/v1/system/schema/plan',
      '/v1/system/schema/approvals',
      '/v1/system/schema/apply',
      '/v1/system/schema/revert',
      '/v1/system/snapshots',
    ]);
    expect(systemOpenApiContract.components.schemas.SystemScope.enum).toEqual(expectedScopes);
    expect(JSON.stringify(systemOpenApiContract)).not.toContain('master');
    expect(JSON.stringify(systemOpenApiContract)).not.toContain('secretMac');
  });
});
