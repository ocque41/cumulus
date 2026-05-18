# Self-Hosting Cumulus

Self-hosting gives you control over the app, auth provider, database, and Cumulus DB service. Cumulus Cloud is the easier path if you do not want to run infrastructure.

## Minimum Services

- Node.js 20+
- A Next.js hosting target
- Supabase-compatible auth/database configuration
- Cumulus DB service for agent workspace storage
- Optional Stripe configuration for billing

## License Note

The root Cumulus app is Apache-2.0. The self-hosted Cumulus DB provider in `apps/cumulus-db` is AGPL-3.0-only. If you modify Cumulus DB and run it as a network service, treat those provider changes as AGPL-covered.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run db:build
npm run db:start
npm run dev
```

Use placeholders from `.env.example`. Do not commit your local `.env.local`.

`CUMULUS_AUTH_MODE=supabase` is the default for the Next.js app. Set
`CUMULUS_AUTH_MODE=cumulus_oidc` only when you want the Cumulus DB system proxy
to verify the provided Cumulus bearer through `/oidc/userinfo` instead of a
Supabase browser session. The full browser login migration remains private
overlay work.

For the app database schema, use the SQL baseline in `supabase/migrations`.
Run it with Supabase local tooling or with `psql` against a normal
`postgres://` connection string. Do not run local migrations through hosted-only
HTTP database clients such as Neon serverless; those clients are for hosted
HTTP endpoints and can break `127.0.0.1` local Postgres URLs.

## Cumulus DB Access

The public dashboard does not use the Cumulus DB master key. Connect with:

- database id,
- scoped bearer token.

The master key is for provisioning and private administration only.

After connecting, use `/dashboard/database` to verify the database API. The dashboard shows provider health and MCP metadata, reads and writes key-value entries, appends events, lists records in detailed or compact mode, and searches by text, vector, type, and limit.

The token, backup, and compaction panels require an admin token or a token with the matching scopes. A normal data token can write records, events, and key-value entries, but it cannot reveal secrets, manage tokens, create backups, or compact the database.

The **Seed evidence** action writes sample records for every supported type and uses the event and key-value HTTP routes.

## Cumulus DB v1 System Surface

The self-hosted provider includes the same v1 control-plane foundation as the
hosted provider contract:

- Nimbus source compiles to canonical JSON IR.
- `/v1/system/schema/plan` previews changes and labels risk.
- `/v1/system/schema/apply` applies approved plans.
- `/v1/system/schema/revert` restores a version or snapshot.
- `/v1/system/audit` exposes the audit trail.
- `/v1/system/snapshots` creates encrypted logical snapshots.
- `/v1/system/agents/bootstrap` creates a pending agent workspace with a limited
  agent token. Keep it admin-gated on any shared provider. The
  `CUMULUS_DB_PUBLIC_AGENT_BOOTSTRAP_ENABLED=true` escape hatch is only for
  local development.

Use system tokens with explicit scopes. New system scopes are hard scopes:
`database:admin` is not a wildcard for destructive schema, approval, revert,
secret, billing, or member operations.

Select the engine with `CUMULUS_DB_ENGINE`.

- `jsonl` stores deterministic local files under `CUMULUS_DB_DATA_DIR`.
- `postgres` uses `CUMULUS_DB_POSTGRES_URL` and the provider runtime schema.

For PostgreSQL, apply `apps/cumulus-db/postgres/system-v1.sql` and
`apps/cumulus-db/postgres/data-v1.sql`, or set
`CUMULUS_DB_AUTO_MIGRATE=true` for local/dev startup. Keep
`CUMULUS_DB_AUTO_MIGRATE=false` for production unless your private overlay owns
the migration step.

Use `npm run db:cli -- help` after `npm run db:build` for device login, agent
bootstrap, schema plan/apply, snapshots, revert, grants, and audit commands.

Hosted Cumulus should use PostgreSQL for MVCC, durable commits, and
point-in-time recovery. The JSONL engine remains the reference path for offline
development, fixtures, and deterministic tests.

## Cloud API Path

Use Cumulus Cloud/API when you want Cumulus to host the database and operational systems for you. Set the cloud API values from `.env.example` in your deployment environment.
