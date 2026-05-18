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

Tokens that mint hard system scopes must already hold every hard scope they
grant, plus `token:create`. This prevents a narrow token creator from turning
itself into a destructive schema or organization operator.

Agent bootstrap is admin-gated by default. Use
`CUMULUS_DB_PUBLIC_AGENT_BOOTSTRAP_ENABLED=true` only for a local development
provider where unauthenticated bootstrap is acceptable.

## Tokens

New machine tokens are opaque and classed:

```text
cu_agt_v1_<publicId>_<secret>
cu_pat_v1_<publicId>_<secret>
cdb_admin_v1_<publicId>_<secret>
```

The provider stores the public id and an HMAC-SHA-256 of the random secret. It
does not store the token plaintext. Existing local SHA-256 token records still
verify for compatibility.

## Hosted PostgreSQL Boundary

Set `CUMULUS_DB_ENGINE=postgres` to run the provider against PostgreSQL. The
runtime also needs `CUMULUS_DB_POSTGRES_URL`. `CUMULUS_DB_POSTGRES_SSL` accepts
`false`, `true`, `require`, `disable`, or `no-verify`.

`CUMULUS_DB_AUTO_MIGRATE=false` is the default. When it stays false, apply both
SQL files before startup:

- `apps/cumulus-db/postgres/system-v1.sql`
- `apps/cumulus-db/postgres/data-v1.sql`

`system-v1.sql` defines the `cumulus_system` contract for orgs, identities,
accounts, memberships, tokens, audit logs, schema versions, snapshots,
approvals, and revert runs. `data-v1.sql` defines the `cumulus_data` runtime
tables for manifests, workspace tokens, records, WAL, audit logs, system state,
and encrypted snapshots.

The public app must still call Cumulus DB over HTTP/token APIs. Do not import the
AGPL provider package from Apache-side app code.

## OIDC, CLI, And System Console

The provider exposes local/dev OIDC and OAuth-compatible endpoints:

- `/.well-known/openid-configuration`
- `/oauth/authorize`
- `/oauth/device_authorization`
- `/oauth/device_authorization/verify`
- `/oauth/token`
- `/oidc/userinfo`

The local/dev implementation stores email-code, device-code, passkey step-up,
and rate-limit state in provider memory. Production email adapters, durable auth
session storage, production OIDC signing keys, and client-controlled KEK custody
stay in the private production overlay.

After `npm run db:build`, use `npm run db:cli -- help` to see the Cumulus DB CLI.
It covers device login, agent bootstrap, `whoami`, schema plan/apply, snapshots,
revert, grants, audit tail, token rotation, and Nimbus passthrough commands.

The Apache-side `/api/cumulus-db/system/*` proxy requires a signed-in app user
and a Cumulus DB bearer token. It forwards the bearer token only. It does not
forward the provider master key.

The app keeps Supabase auth as the default with `CUMULUS_AUTH_MODE=supabase`.
When `CUMULUS_AUTH_MODE=cumulus_oidc`, the system proxy verifies the supplied
Cumulus DB bearer through `/oidc/userinfo`. The broader browser-session
migration remains private overlay work.

`/dashboard/system` is the operator console for scopes, principals, grants,
schema plans, approvals, snapshots, revert, audit, and agent lifecycle actions.

## Snapshot Encryption

System snapshots and local backups use a per-snapshot random DEK with
AES-256-GCM and authenticated metadata. The public local/dev provider wraps that
DEK with `CUMULUS_DB_MASTER_KEY`. Hosted production should replace local key
custody with private-overlay client-controlled KEK wiring while preserving the
public wrapped-DEK snapshot format.
