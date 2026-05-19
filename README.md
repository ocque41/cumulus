# Cumulus

Cumulus is an open-source Next.js app for AI-first product surfaces, auth, billing hooks, dashboards, and agent workspace storage through Cumulus DB.

The main repo is Apache-2.0. The from-scratch Cumulus Database provider in `apps/cumulus-db` is AGPL-3.0-only. The Cumulus name, logos, and hosted-service branding are covered by `TRADEMARKS.md`.

## Two Ways To Run It

### 1. Cumulus Cloud/API

This is the easiest path. Cumulus hosts the operational services for you. You configure the app with a cloud API URL and key, then keep building on the public codebase.

Use this path if you do not want to run infrastructure.

### 2. Self-Hosted

This path gives you control. You run the app, auth/database provider, and Cumulus DB service yourself.

Use this path if you want to own the whole stack.

See `docs/self-hosting.md`.

## Public Repo And Private Production Overlay

This public repo contains the shared product:

- marketing and inner pages,
- auth flow,
- billing hooks,
- dashboard,
- Cumulus DB,
- API routes,
- public docs,
- tests.

Cumulus production uses a private overlay for things that cannot be public:

- real `.env` values,
- real provider accounts,
- production legal provider lists,
- private admin tools,
- deployment credentials,
- internal runbooks,
- customer data.

Most improvements should land here first, then be pulled into the private production overlay. This keeps the community and production versions aligned without leaking private systems.

## Quick Start

Create a new Relay/Cumulus app:

```bash
npx create-cumulus@latest my-acme
npm create cumulus@latest my-acme
```

Useful non-interactive examples:

```bash
npx create-cumulus@latest my-acme --template full --agent-auth hosted
npx create-cumulus@latest my-acme --template outer --agent-auth hosted
npx create-cumulus@latest my-acme --template inner --agent-auth self-hosted --cumulus-db both
npx create-cumulus@latest my-acme --template agent-auth --cumulus-db cloud
```

The generator supports `full`, `outer`, `inner`, and `agent-auth` templates;
`hosted` and `self-hosted` agent auth modes; and `cloud`, `local`, or `both`
Cumulus DB modes. The marketing docs page at `/docs` explains every option.

Run this repo locally:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Terminal Site

Cumulus also ships a terminal website package in `packages/terminal-site`.
It is separate from the private Next app package so it can be published as a
small public command.

Run it locally:

```bash
npm run terminal
```

From npm, users can run:

```bash
npx cumulush
npx cumulush /documents
npx cumulush /relay
npx cumulush /contact
```

The terminal site includes pages for Cumulus, Documents, Relay, Tado, Rune,
and Contact. The home and Documents pages advertise `create-cumulus` and show
how to install and choose templates. The contact page opens a local email draft
to `hi@cumulush.com`; it does not ship email service secrets in the public
package.

## Cumulus DB

Cumulus DB is the standalone workspace database included in `apps/cumulus-db`.

Run it locally:

```bash
npm run db:build
npm run db:start
```

The public dashboard connects with:

- database id,
- scoped bearer token.

It does not expose the Cumulus DB master key through public user routes.

The database dashboard at `/dashboard/database` can prove the API surface against any connected workspace. It shows provider health and MCP metadata, reads and writes key-value entries, appends events, lists records in detailed or compact mode, searches by text/vector/type/limit, and manages admin-only token, backup, and compaction actions when the connected token has those scopes.

Click **Seed evidence** to write one sample for every supported record type, including `note`, `run`, `message`, `event`, `tool_call`, `artifact`, `task`, `observation`, `secret`, and `kv`.

The v1 database foundation also includes:

- Nimbus `.nimbus` source compilation to canonical JSON IR,
- hard `/v1/system` scopes for agents, schema plans, approvals, snapshots, audit, apply, and revert,
- local JSONL and hosted-style PostgreSQL plan/apply/revert execution,
- classed opaque machine tokens stored with keyed HMAC verification,
- Cumulus-native OIDC/OAuth-compatible local/dev endpoints,
- a Cumulus DB CLI through `npm run db:cli -- help`,
- hosted PostgreSQL schema contracts at `apps/cumulus-db/postgres/system-v1.sql` and `apps/cumulus-db/postgres/data-v1.sql`.

See `docs/cumulus-db-v1.md` for the system flow, hard scopes, Nimbus rules, and hosted/local engine split.

License note: `apps/cumulus-db` is AGPL-3.0-only. App-side integration code remains Apache-2.0 and talks to it over HTTP/token APIs.

## Commands

```bash
npm run dev
npm run lint
npm run license:check
npm run test
npm run terminal:pack
npm run db:test
npm run build
```

## Releases

Public releases are tracked in `CHANGELOG.md` and tagged as `vX.Y.Z`. See `docs/releasing.md`.

- **v0.4.0** (2026-05-19) - Cumulus DB v1 and Nimbus foundation with Postgres runtime, system console, OIDC/device auth, CLI, MCP schemas, and machine contracts.

## Project Structure

```text
src/app             Next.js routes
src/components      UI components
src/lib             app logic and server helpers
packages/auth       local @cumulus/auth package
packages/terminal-site publishable terminal website package
apps/cumulus-db     standalone Cumulus DB service
supabase            public-safe database migrations
docs                public documentation
```

## Public Release Safety

Before publishing a public release or fresh-history export, run the checklist in `docs/public-release.md`.

Important rule: removing a secret from the current tree is not enough if the old git history will be public. If a real credential ever appeared in tracked files, rotate it and publish from fresh history.

## License

Apache-2.0 for the root app and public repo code, except `apps/cumulus-db`, which is AGPL-3.0-only. See `LICENSE`, `apps/cumulus-db/LICENSE`, and `docs/licensing.md`.
