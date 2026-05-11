# AGENTS.md

This repository is the public Cumulus codebase. Treat every tracked file as something the community can read, fork, and run.

## License Model

- The root app, docs, auth package, public migrations, and app integration code are Apache-2.0.
- The from-scratch Cumulus Database provider in `apps/cumulus-db` is AGPL-3.0-only.
- Do not move AGPL database-provider code into Apache-2.0 areas.
- Do not make Apache-side code import `@cumulus/database` or `apps/cumulus-db` source directly. Use HTTP/token APIs.
- New TypeScript source files under `apps/cumulus-db/src` must include the AGPL SPDX header.

## Public And Private Split

- Put shared product work in this public repo whenever it is safe: UI, docs, tests, database code, API contracts, self-host setup, and cloud API integration.
- Keep production-only material in the private production overlay: real `.env` values, real provider accounts, private admin tools, deployment credentials, internal runbooks, and customer data.
- Production should track this public repo closely. Most upgrades should land here first, then be pulled into the private overlay.
- Do not add notes about private plans, unreleased business strategy, customer names, real provider dashboards, or internal incident/debugging details.

## Safety Rules

- Never commit secrets, tokens, cookies, private keys, database dumps, local runtime data, or screenshots/logs that show real users.
- Never hard-code real project IDs, tenant IDs, provider account IDs, or internal URLs.
- Use placeholders in examples, for example `https://your-project.supabase.co` and `replace-with-strong-secret`.
- Keep admin/global data access behind private-overlay configuration. Public routes must use user-scoped access.
- If a feature needs real production wiring, document the public interface and leave the production values to the private overlay.

## Development

Use the normal project commands:

```bash
npm install
npm run dev
npm run lint
npm run license:check
npm run test
npm run db:test
npm run build
```

Before preparing a public release, run the public safety checks described in `docs/public-release.md`.

## Cumulus DB

Cumulus DB is included for self-hosting and local development. The provider code is AGPL-3.0-only. The public dashboard connects with a database id and scoped bearer token. Do not expose the Cumulus DB master key through public user routes.

## Documentation

Write docs for users who may not know this codebase. Use plain language. Explain what a setting does, when it is required, and whether it belongs in the public repo or the private production overlay.
