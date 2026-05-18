# Cumulus Database

Cumulus Database is a standalone agent-owned database service. Relay provisions
workspaces through `POST /v1/relay/signup`; agents then use the returned
endpoint, database id, data token, and admin token.

Cumulus DB v1 now has two storage roles:

- hosted provider target: PostgreSQL control-plane schema in `postgres/system-v1.sql`,
- local reference engine: deterministic JSONL files under `CUMULUS_DB_DATA_DIR`.

The product boundary is not raw SQL. The boundary is Nimbus canonical JSON IR,
the HTTP API, the scope model, audit records, snapshots, and SDK/MCP contracts.

## License

This directory is licensed under AGPL-3.0-only. See `LICENSE`.

The rest of the Cumulus repo is licensed separately. Keep database-provider code
inside this directory, and keep app-side integration over HTTP/token APIs.

## Local run

```bash
cp apps/cumulus-db/.env.example apps/cumulus-db/.env
npm run db:build
CUMULUS_DB_MASTER_KEY="$(node -e 'console.log(Buffer.alloc(32, 7).toString("base64"))')" npm run db:start
```

Runtime data is written under `CUMULUS_DB_DATA_DIR` and is gitignored.

## Core endpoints

- `GET /health`
- `POST /v1/relay/signup`
- `GET /v1/databases`
- `POST /v1/databases/:dbId/records`
- `POST /v1/databases/:dbId/search`
- `PUT /v1/databases/:dbId/kv/:key`
- `POST /v1/databases/:dbId/secrets/reveal`
- `POST /v1/env/parse`
- `GET|POST /mcp`

## System and Nimbus endpoints

The `/v1/system` surface is the protected control plane. It uses hard scopes:
`database:admin` does not automatically satisfy new system scopes.

- `GET /v1/system/scopes` lists the v1 hard scopes and labels.
- `POST /v1/system/agents/bootstrap` creates a pending agent workspace and
  returns a limited `cu_agt_v1_<publicId>_<secret>` token. It requires the
  admin header unless `CUMULUS_DB_PUBLIC_AGENT_BOOTSTRAP_ENABLED=true` is set
  for a local development provider.
- `GET /v1/system/state?dbId=...` reads principals, grants, schema versions,
  snapshots, plans, and approvals. Requires `system:read`.
- `GET /v1/system/audit?dbId=...` reads audit events. Requires `audit:read`.
- `POST /v1/system/schema/plan` compiles Nimbus source or accepts Nimbus IR,
  computes the three-way schema plan, and classifies risk. Requires
  `schema:plan`.
- `POST /v1/system/schema/approvals` issues a short-lived plan-bound approval.
  Requires `member:approve`.
- `POST /v1/system/schema/apply` applies a plan. Safe plans require
  `schema:apply_safe`. Destructive plans require `schema:apply_destructive` and
  the approval token bound to the plan hash.
- `POST /v1/system/schema/revert` restores a schema version or snapshot.
  Requires `schema:revert_local` and a revert approval token.
- `GET|POST /v1/system/snapshots` lists or creates encrypted logical snapshots.

The MCP manifest also advertises dry-run-first system tools:
`cumulus.plan_schema`, `cumulus.read_system_state`,
`cumulus.request_approval`, `cumulus.apply_schema`,
`cumulus.create_snapshot`, `cumulus.revert_version`, and
`cumulus.rotate_self_token`.

## Nimbus source

Nimbus is a small declarative language that compiles to canonical JSON.
Secrets stay as references:

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

The compiler:

- emits `nimbus.cumulus/v1alpha1` canonical JSON,
- sorts keys before hashing,
- promotes `///` doc comments,
- rejects reserved namespaces such as `system` unless the caller is
  provider-owned; public HTTP planning never accepts a caller-provided override,
- compiles `env("NAME")` to `{ "kind": "envRef", "name": "NAME" }` instead of
  reading the secret value.

## Token storage

New machine tokens are opaque and classed, for example
`cu_agt_v1_<publicId>_<secret>` and `cdb_admin_v1_<publicId>_<secret>`.
The provider stores the public id and an HMAC-SHA-256 of the random secret using
the provider master key. Old local SHA-256 token records still verify so
existing development workspaces do not break.

## Plan, apply, snapshot, revert

The schema lifecycle is:

1. compile Nimbus source to canonical JSON IR,
2. read live and last-applied state,
3. compute a plan with risk labels,
4. require approval for destructive plans,
5. create an encrypted pre-apply snapshot for medium or higher risk,
6. write live and last-applied state,
7. append audit records,
8. expose a schema version or snapshot as a revert target.

Snapshots are product-level logical snapshots. They are encrypted with the
provider master key in the local engine and contain enough encrypted state to
restore schema state without exposing plaintext secrets in audit or IR.

## Production default

Run this service separately from the Next.js site on a host with persistent
disk mounted at `CUMULUS_DB_DATA_DIR`, for example `/var/data/cumulus-db`.
Use Cumulus logical snapshots for restores; disk snapshots are extra safety,
not the database restore format.

Hosted Cumulus should run the official provider on PostgreSQL. The public v1
schema contract is `postgres/system-v1.sql`; it defines `cumulus_system` tables
for orgs, identities, human accounts, agent accounts, memberships, tokens,
audit logs, schema versions, snapshots, approvals, and revert runs. The JSONL
engine stays useful for local development, fixtures, and deterministic tests.
