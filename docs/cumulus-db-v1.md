# Cumulus DB v1 And Nimbus

Cumulus DB v1 uses a split engine model.

- Hosted Cumulus should run the official provider on PostgreSQL.
- Local development uses the JSONL reference engine.
- The shared product contract is Nimbus IR, HTTP endpoints, scopes, plans,
  snapshots, audit records, and SDK/MCP behavior.

This keeps local work simple without making file storage the reliability ceiling
for the hosted service.

## Nimbus

Nimbus files use the `.nimbus` extension. They describe desired schema state:

```nimbus
namespace acme {
  collection agents {
    fields: {
      id: { type: "ulid", required: true },
      status: { type: "string", enum: ["active", "disabled", "pending"] }
    }
  }

  secret backup_kek {
    from: env("CUMULUS_BACKUP_KEK")
  }
}
```

The compiler emits canonical JSON IR with stable key ordering and a stable hash.
It does not read environment values. `env("NAME")` becomes an `envRef` in IR.

Reserved namespaces such as `system`, `_system`, `_cumulus`, and `cumulus` are
blocked unless the caller is provider-owned. Public HTTP planning does not
accept a caller-provided reserved-namespace override, and direct IR input is
validated with the same rule.

## System Flow

The schema lifecycle is:

1. Compile Nimbus source to canonical JSON IR.
2. Read live and last-applied state.
3. Produce a plan and risk level.
4. Require a plan-bound approval for destructive changes.
5. Create an encrypted pre-apply snapshot for medium or higher risk.
6. Apply state under the provider engine.
7. Write a schema version and audit event.
8. Revert by version or snapshot when needed.

## Hard Scopes

System operations use explicit scopes. Important examples:

- `system:read`
- `audit:read`
- `schema:plan`
- `schema:apply_safe`
- `schema:apply_destructive`
- `schema:revert_local`
- `member:approve`
- `backup:create`
- `backup:restore`

The legacy `database:admin` scope remains for older data routes, but it is not a
wildcard for new system scopes.

Agent bootstrap is admin-gated by default. Use
`CUMULUS_DB_PUBLIC_AGENT_BOOTSTRAP_ENABLED=true` only for a local development
provider where unauthenticated bootstrap is acceptable.

## Tokens

New machine tokens are opaque and classed:

```text
cu_agt_v1_<publicId>_<secret>
cdb_admin_v1_<publicId>_<secret>
```

The provider stores the public id and an HMAC-SHA-256 of the random secret. It
does not store the token plaintext. Existing local SHA-256 token records still
verify for compatibility.

## Hosted PostgreSQL Boundary

The hosted schema contract is
`apps/cumulus-db/postgres/system-v1.sql`. It defines `cumulus_system` tables for
orgs, identities, accounts, memberships, tokens, audit logs, schema versions,
snapshots, approvals, and revert runs.

The public app must still call Cumulus DB over HTTP/token APIs. Do not import the
AGPL provider package from Apache-side app code.
