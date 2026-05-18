// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest';
import { compileNimbus } from '../nimbus.js';

const source = `
nimbus "v1alpha1"

/// Application workspace schema.
namespace acme {
  collection agents {
    fields: {
      id: { type: "ulid", required: true },
      orgId: { type: "ulid", required: true },
      status: { type: "string", enum: ["active", "disabled", "pending"], default: "pending" }
    }

    index agents_org_status {
      keys: ["orgId", "status"]
      unique: false
    }
  }

  secret backup_kek {
    from: env("CUMULUS_BACKUP_KEK")
  }
}
`;

describe('Nimbus compiler', () => {
  it('compiles source into deterministic canonical JSON IR', () => {
    const first = compileNimbus(source, { fileName: 'system.nimbus' });
    const second = compileNimbus(source, { fileName: 'system.nimbus' });

    expect(first.hash).toBe(second.hash);
    expect(first.canonicalJson).toBe(second.canonicalJson);
    expect(first.ir.apiVersion).toBe('nimbus.cumulus/v1alpha1');
    expect(first.ir.kind).toBe('NimbusDocument');
    expect(first.ir.metadata.docs).toBe('Application workspace schema.');
    expect(first.ir.spec.namespace).toBe('acme');
    expect(first.ir.spec.collections[0]?.name).toBe('agents');
    expect(first.ir.spec.collections[0]?.fields.status).toEqual({
      default: 'pending',
      enum: ['active', 'disabled', 'pending'],
      type: 'string',
    });
    expect(first.ir.spec.secrets[0]?.source).toEqual({ kind: 'envRef', name: 'CUMULUS_BACKUP_KEK' });
    expect(first.canonicalJson).not.toContain('replace-with-strong-secret');
  });

  it('rejects reserved system namespaces unless the caller is provider-owned', () => {
    expect(() =>
      compileNimbus(`
        namespace system {
          collection agents { fields: { id: { type: "ulid" } } }
        }
      `),
    ).toThrow('reserved');

    expect(
      compileNimbus(
        `
        namespace system {
          collection agents { fields: { id: { type: "ulid" } } }
        }
      `,
        { allowSystemNamespace: true },
      ).ir.spec.namespace,
    ).toBe('system');
  });

  it('requires secret declarations to compile as env references', () => {
    expect(() =>
      compileNimbus(`
        namespace acme {
          secret bad { from: "plaintext-secret" }
          collection notes { fields: { id: { type: "ulid" } } }
        }
      `),
    ).toThrow('env');
  });
});
