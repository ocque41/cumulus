// SPDX-License-Identifier: AGPL-3.0-only
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { compileNimbus } from '../nimbus.js';
import { CumulusDbEngine } from '../storage.js';

const initialSource = `
namespace acme {
  collection agents {
    fields: {
      id: { type: "ulid", required: true },
      status: { type: "string", required: false }
    }
  }
}
`;

const destructiveSource = `
namespace acme {
  collection agents {
    fields: {
      id: { type: "ulid", required: true }
    }
  }
}
`;

async function engine() {
  const dataDir = await mkdtemp(join(tmpdir(), 'cumulus-db-system-'));
  return new CumulusDbEngine(dataDir, Buffer.alloc(32, 5));
}

describe('Cumulus system model', () => {
  it('bootstraps an agent with limited system scopes and keyed-MAC token storage', async () => {
    const db = await engine();
    const boot = await db.bootstrapAgent({ displayName: 'builder-agent' });
    const state = await db.getSystemState(boot.databaseId);
    const tokens = await db.readTokens(boot.databaseId);

    expect(state.org.status).toBe('pending_claim');
    expect(state.principals[0]?.grants).toEqual([
      'system:read',
      'org:read',
      'schema:read',
      'schema:plan',
      'token:rotate_self',
    ]);
    expect(boot.token.token).toMatch(/^cu_agt_v1_/);
    expect(tokens.some((token) => token.secretMac && token.tokenPublicId && !token.tokenHash)).toBe(true);

    await db.authenticate(boot.databaseId, boot.token.token, ['schema:plan']);
    await expect(db.authenticate(boot.databaseId, boot.token.token, ['schema:apply_safe'])).rejects.toThrow('unauthorized');

    await db.destroyAllForTests();
  });

  it('plans, applies, snapshots, approves, and reverts schema changes', async () => {
    const db = await engine();
    const created = await db.createWorkspace({ ownerAgentId: 'agent-1', humanOwnerEmail: 'owner@example.com' });

    const firstPlan = await db.planSchema(created.manifest.id, { source: initialSource });
    expect(firstPlan.riskLevel).toBe('low');
    const firstApply = await db.applySchemaPlan(created.manifest.id, { planId: firstPlan.id });
    expect(firstApply.snapshot).toBeNull();
    expect((await db.getSystemState(created.manifest.id)).schema.live?.spec.collections[0]?.fields.status).toBeTruthy();

    const destructivePlan = await db.planSchema(created.manifest.id, { source: destructiveSource });
    expect(destructivePlan.riskLevel).toBe('destructive');
    await expect(db.applySchemaPlan(created.manifest.id, { planId: destructivePlan.id })).rejects.toThrow('approval');

    const approval = await db.createSchemaApproval(created.manifest.id, destructivePlan.id);
    const destructiveApply = await db.applySchemaPlan(created.manifest.id, {
      planId: destructivePlan.id,
      approvalToken: approval.approvalToken,
    });
    expect(destructiveApply.snapshot?.kind).toBe('pre_apply');
    expect((await db.getSystemState(created.manifest.id)).schema.live?.spec.collections[0]?.fields.status).toBeUndefined();

    const snapshotBody = JSON.parse(await readFile(destructiveApply.snapshot!.path, 'utf8')) as { ciphertext: string };
    expect(snapshotBody.ciphertext).toBeTruthy();
    expect(JSON.stringify(snapshotBody)).not.toContain('"status"');

    const revertApproval = await db.createRevertApproval(created.manifest.id, { versionId: firstApply.versionId });
    await db.revertSchema(created.manifest.id, {
      versionId: firstApply.versionId,
      approvalToken: revertApproval.approvalToken,
    });
    const reverted = await db.getSystemState(created.manifest.id);
    expect(reverted.schema.live?.spec.collections[0]?.fields.status).toBeTruthy();
    expect((await db.listAudit(created.manifest.id)).some((event) => JSON.stringify(event).includes('system.schema_revert'))).toBe(true);

    await db.destroyAllForTests();
  });

  it('rejects reserved direct IR and stale schema plans', async () => {
    const db = await engine();
    const created = await db.createWorkspace({ ownerAgentId: 'agent-1', humanOwnerEmail: 'owner@example.com' });
    const reserved = compileNimbus(
      'namespace system { collection agents { fields: { id: { type: "ulid" } } } }',
      { allowSystemNamespace: true },
    );

    await expect(db.planSchema(created.manifest.id, { desired: reserved.ir })).rejects.toThrow('reserved');

    const firstPlan = await db.planSchema(created.manifest.id, {
      source: 'namespace acme { collection notes { fields: { id: { type: "ulid" }, body: { type: "string" } } } }',
    });
    const stalePlan = await db.planSchema(created.manifest.id, {
      source: 'namespace acme { collection notes { fields: { id: { type: "ulid" }, title: { type: "string" } } } }',
    });

    await db.applySchemaPlan(created.manifest.id, { planId: firstPlan.id });
    await expect(db.applySchemaPlan(created.manifest.id, { planId: stalePlan.id })).rejects.toThrow('stale');

    await db.destroyAllForTests();
  });
});
