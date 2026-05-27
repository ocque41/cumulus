# Cumulus Database

Cumulus Database is a standalone agent-owned database service. Relay provisions
workspaces through `POST /v1/relay/signup`; agents then use the returned
endpoint, database id, data token, and admin token.

Cumulus DB v1 now has two storage roles:

- hosted provider runtime: PostgreSQL with `cumulus_system` and `cumulus_data`
  schemas,
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

Select the runtime engine with `CUMULUS_DB_ENGINE`:

```bash
# Local reference engine.
CUMULUS_DB_ENGINE=jsonl npm run db:start

# Hosted-style runtime using PostgreSQL.
CUMULUS_DB_ENGINE=postgres \
  CUMULUS_DB_POSTGRES_URL=postgres://postgres@127.0.0.1:5432/postgres \
  CUMULUS_DB_AUTO_MIGRATE=true \
  npm run db:start
```

`CUMULUS_DB_AUTO_MIGRATE=false` is the default. With that default, apply
`postgres/system-v1.sql` and `postgres/data-v1.sql` before startup.

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

## OIDC and OAuth endpoints

The provider exposes a local/dev Cumulus-native auth server surface:

- `GET /.well-known/openid-configuration`
- `POST /oauth/authorize` for authorization code + PKCE with local email-code
  records,
- `POST /oauth/device_authorization` and
  `POST /oauth/device_authorization/verify` for CLI/device login,
- `POST /oauth/token` for authorization code, device code, and restricted token
  exchange,
- `GET|POST /oidc/userinfo` for user claims.

This public implementation keeps email, passkey step-up, and rate-limit records
in local provider memory. Real email delivery, production OIDC signing keys,
durable auth-session storage, and external key custody belong in the private
production overlay.

## System and Nimbus endpoints

The `/v1/system` surface is the protected control plane. It uses hard scopes:
`database:admin` does not automatically satisfy new system scopes.
Tokens that grant hard system scopes require `token:create`, and the caller
must already hold each hard scope being granted.

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

The Postgres-first Nimbus database transaction surface is separate from the
older system schema lifecycle:

- `POST /v1/database/manifests:compile` compiles a `nimbus.db/v0.1` manifest
  into hashable database IR. Requires `schema:plan`.
- `POST /v1/database/plans` creates an immutable plan from a manifest or IR and
  either caller-supplied fixture state or live inspection. Requires
  `schema:plan`.
- `GET /v1/database/plans/:planId?dbId=...` reads a saved plan record and
  current transaction status. Requires `schema:plan`.
- `POST /v1/database/plans:approve` creates a plan-hash-bound approval.
  Requires `member:approve`.
- `POST /v1/database/plans:apply` applies the saved plan after drift, risk, and
  approval checks. Safe plans require `schema:apply_safe`; destructive or
  unknown plans require `schema:apply_destructive`.
- `POST /v1/database/snapshots` creates a manual logical database snapshot from
  supplied fixture state or live inspection. Requires `backup:create`.
- `POST /v1/database/snapshots:restore` restores a logical database snapshot in
  the fixture or provider engine. Requires `schema:revert_local`.
- `GET /v1/database/audit?dbId=...` reads persisted hash-chained transaction
  audit events. Requires `audit:read`.
- `POST /v1/database/audit:verify` verifies a supplied audit chain. Requires
  `audit:read`.

The MCP manifest returns both the compatibility tool-name list and structured
`toolSchemas` with required arguments, mode, MCP safety annotations, and
dry-run-first metadata for system and database actions:
`cumulus.plan_schema`, `cumulus.read_system_state`,
`cumulus.request_approval`, `cumulus.apply_schema`,
`cumulus.create_snapshot`, `cumulus.revert_version`, and
`cumulus.rotate_self_token`, plus `cumulus.compile_manifest`,
`cumulus.create_plan`, `cumulus.get_plan`, `cumulus.classify_risk`,
`cumulus.request_database_approval`, `cumulus.apply_plan`,
`cumulus.restore_snapshot`, `cumulus.revert`, `cumulus.get_audit_events`, and
`cumulus.verify_audit_chain`.

## CLI

Build first, then use the provider-owned CLI:

```bash
npm run db:build
npm run db:cli -- login --db-id db_example --scope "openid email system:read"
npm run db:cli -- login --device-code dev_code_from_previous_step
npm run db:cli -- agent init --admin-key replace-with-strong-secret
npm run db:cli -- db plan --db-id db_example --token cu_pat_v1_public_secret --file schema.nimbus
npm run db:cli -- db approve --db-id db_example --token cu_pat_v1_public_secret --plan-id plan_example
npm run db:cli -- db apply --db-id db_example --token cu_pat_v1_public_secret --plan-id plan_example
npm run db:cli -- db snapshot --db-id db_example --token cu_pat_v1_public_secret
npm run db:cli -- db approve --db-id db_example --token cu_pat_v1_public_secret --kind revert --version-id ver_example
npm run db:cli -- db revert --db-id db_example --token cu_pat_v1_public_secret --version-id ver_example --approval-token apv_secret
npm run db:cli -- database compile --db-id db_example --token cu_pat_v1_public_secret --manifest manifest.json
npm run db:cli -- database plan --db-id db_example --token cu_pat_v1_public_secret --manifest manifest.json
npm run db:cli -- database get-plan --db-id db_example --token cu_pat_v1_public_secret --plan-id plan_example
npm run db:cli -- database approve --db-id db_example --token cu_pat_v1_public_secret --plan-id plan_example --reason "Approved dev change"
npm run db:cli -- database apply --db-id db_example --token cu_pat_v1_public_secret --plan-id plan_example --approval-id appr_example
npm run db:cli -- database restore --db-id db_example --token cu_pat_v1_public_secret --snapshot snapshot.json
npm run db:cli -- database audit --db-id db_example --token cu_pat_v1_public_secret --plan-id plan_example
npm run db:cli -- database audit-verify --db-id db_example --token cu_pat_v1_public_secret --audit audit.json
npm run db:cli -- system grants ls --db-id db_example --token cu_pat_v1_public_secret
npm run db:cli -- system grants set --db-id db_example --token cu_pat_v1_public_secret --principal-id agt_example --grant system:read
npm run db:cli -- audit tail --db-id db_example --token cu_pat_v1_public_secret
npm run db:cli -- nimbus check schema.nimbus
```

The CLI calls HTTP endpoints. It does not import the storage engines directly.

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
`cu_agt_v1_<publicId>_<secret>`, `cu_pat_v1_<publicId>_<secret>`, and
`cdb_admin_v1_<publicId>_<secret>`.
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

The database-state transaction MVP adds a narrower Postgres-first boundary for
Nimbus database manifests:

1. compile `nimbus.db/v0.1` manifests into hashable database IR,
2. inspect a PostgreSQL current-state graph,
3. create an immutable Cumulus plan with SQL steps and risk labels,
4. reject drifted applies,
5. require plan-hash-bound approval for destructive or unknown risk,
6. create a logical pre-apply snapshot before destructive apply,
7. emit a hash-chained audit trail,
8. restore the logical snapshot for dev fixture revert.

Start from `examples/manifests/customer-core-db.json` for the first demo
manifest. A typical demo compiles that manifest, creates a plan against an
inspected or fixture state, reviews the risk summary, records approval if the
plan is destructive, applies the exact saved plan, reads the audit chain, and
restores the pre-apply snapshot when testing revert.

Snapshots are product-level logical snapshots. Each snapshot uses a random
per-snapshot DEK with AES-256-GCM and AAD metadata. The DEK is wrapped by the
configured provider key in local/dev. Production client-controlled KEK custody
belongs in the private overlay, but the public storage format already stores
only wrapped keys and ciphertext.

## Production default

Run this service separately from the Next.js site on a host with persistent
disk mounted at `CUMULUS_DB_DATA_DIR`, for example `/var/data/cumulus-db`.
Use Cumulus logical snapshots for restores; disk snapshots are extra safety,
not the database restore format.

Hosted Cumulus should run the official provider on PostgreSQL. The public v1
schema contracts are `postgres/system-v1.sql` and `postgres/data-v1.sql`.
`cumulus_system` holds the control-plane contract for orgs, identities, human
accounts, agent accounts, memberships, tokens, audit logs, schema versions,
snapshots, approvals, and revert runs. `cumulus_data` is the runtime store used
by `PostgresCumulusDbEngine` for workspaces, tokens, records, WAL, audit,
system state, and encrypted snapshots. The JSONL engine stays useful for local
development, fixtures, and deterministic tests.
