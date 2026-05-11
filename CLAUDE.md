# CLAUDE.md

This file gives coding agents project context for the public Cumulus repo.

## Project Overview

Cumulus is a Next.js application with public marketing pages, auth, billing hooks, a user dashboard, and the standalone Cumulus DB service. The root app is Apache-2.0. The from-scratch Cumulus Database provider in `apps/cumulus-db` is AGPL-3.0-only.

## License Boundary

- Apache-2.0: root app, docs, auth package, public migrations, app integration code.
- AGPL-3.0-only: `apps/cumulus-db`.
- Do not move AGPL database-provider code into Apache-2.0 app areas.
- Do not import `@cumulus/database` or `apps/cumulus-db` source from Apache-side code.
- App-side integration talks to Cumulus DB over HTTP/token APIs.

The public repo must stay useful end to end:

- marketing and inner pages,
- auth flow,
- billing route hooks,
- dashboard,
- Cumulus DB,
- API routes,
- self-host docs,
- tests.

## Public Repo vs Private Production Overlay

Use one shared codebase model:

- **Public repo:** shared product code, documentation, examples, tests, local/self-host setup, cloud API setup.
- **Private production overlay:** real secrets, real provider config, private admin tools, production legal provider lists, deployment scripts, internal runbooks, and customer data.

Most development should happen in the public repo first. The private production overlay should pull public changes and add only the closed-source pieces needed to run Cumulus Cloud.

## Safety Rules

- Do not commit secrets, `.env` files, private keys, tokens, database dumps, local runtime data, or production logs.
- Do not hard-code real tenant IDs, Supabase project refs, provider account IDs, or internal URLs.
- Do not add internal plans, sprint notes, private agent definitions, or operational debugging notes.
- Public user routes must not proxy master/admin credentials.
- Treat every `NEXT_PUBLIC_*` value as visible to users.

## Common Commands

```bash
npm install
npm run dev
npm run lint
npm run license:check
npm run test
npm run db:test
npm run build
```

## Architecture

- `src/app` contains the Next.js app routes.
- `src/components` contains shared UI.
- `src/lib` contains app logic and server helpers.
- `packages/auth` contains the local `@cumulus/auth` package used by the app.
- `apps/cumulus-db` contains the standalone Cumulus DB service.
- `supabase/migrations` contains public-safe database migrations for self-hosting.
- `docs` contains public documentation.

## Deployment Modes

- **Cloud-first:** users connect to Cumulus Cloud/API. This is the easiest path.
- **Self-hosted:** users run their own app, auth provider, database, and Cumulus DB service.
- **Private production:** Cumulus Cloud uses a private overlay with real production values and admin-only systems.

Keep public docs clear about which mode a setting belongs to.
