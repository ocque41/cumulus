# AGENTS.md

This is the public Cumulus repo. Treat every tracked file as public: users can read it, fork it, run it, and quote it.

Use this file as a map and guardrail, not a manual. Keep durable detail in the repo files below and read only the files needed for the task.

## Source Of Truth

- `README.md` explains the product, setup paths, commands, and repo structure.
- `docs/licensing.md` defines the Apache/AGPL boundary.
- `docs/private-overlay.md` defines what stays public and what belongs in the private production overlay.
- `docs/self-hosting.md` explains the public self-host path.
- `docs/public-release.md` is the release safety checklist.
- `BRAND_GUIDELINES.md` defines the Cumulus visual system for UI work.
- `apps/cumulus-db/AGENTS.md` adds stricter rules for Cumulus DB changes.

If code and docs disagree, inspect the code, fix stale docs when it is in scope, and mention the mismatch.

## Repo Map

- `src/app` contains Next.js routes, API routes, and pages.
- `src/components` contains shared UI.
- `src/lib` contains app logic, server helpers, metadata, and integration code.
- `packages/auth` contains the local Apache-2.0 `@cumulus/auth` package.
- `apps/cumulus-db` contains the AGPL-3.0-only Cumulus DB provider.
- `supabase` contains public-safe database migration material.
- `docs` contains public documentation.
- `scripts` contains validation, release, registry, legal, docs, marketing, and safety checks.

## Hard Boundaries

- Root app, docs, auth package, public migrations, tests, and app integration code are Apache-2.0.
- `apps/cumulus-db` is AGPL-3.0-only.
- Do not move AGPL provider code into Apache-2.0 areas.
- Do not import `@cumulus/database` or `apps/cumulus-db` source from Apache-side code. Use HTTP/token APIs.
- New TypeScript files under `apps/cumulus-db/src` must start with `// SPDX-License-Identifier: AGPL-3.0-only`.
- Public routes must use user-scoped access. Do not expose the Cumulus DB master key through public user routes.

## Public And Private Split

Put shared product work in this public repo when it is safe: UI, docs, tests, public API contracts, self-host setup, Cumulus DB provider code, and cloud API integration.

Keep production-only material in the private production overlay: real `.env` values, real provider accounts, customer data, private admin tools, deployment credentials, internal runbooks, incident notes, and production legal provider lists.

If a feature needs production wiring, document the public interface here and leave real values or private account setup to the overlay.

## Safety Rules

- Never commit secrets, tokens, cookies, private keys, database dumps, local runtime data, or screenshots/logs that show real users.
- Never hard-code real project IDs, tenant IDs, provider account IDs, internal URLs, or private dashboard links.
- Use placeholders in examples, such as `https://your-project.supabase.co` and `replace-with-strong-secret`.
- Treat every `NEXT_PUBLIC_*` value as visible to users.
- Before public release or export, follow `docs/public-release.md` and run `npm run security:scan`.

## Agent Operating Rules

- State assumptions on non-trivial work. If the request is ambiguous or risky, ask or name the assumption before changing code.
- Read before writing. Inspect the owning file, immediate callers, exports, and obvious shared utilities before adding new behavior.
- Keep changes surgical. Touch only what the task requires and clean up only the mess created by the task.
- Prefer the simplest working design. Do not add speculative features, one-use abstractions, or broad refactors.
- Match local conventions. If two patterns conflict, choose the newer or better-tested pattern, explain why, and flag the other as cleanup.
- Use deterministic code for deterministic decisions. Routing, retries, status-code handling, transforms, and validation should live in code, tests, or scripts.
- Keep context lean. Read targeted slices with `rg`/`sed`; if a task gets too large to track clearly, summarize state before continuing.
- Checkpoint long or multi-file work. State what changed, what is verified, and what remains before moving to the next major step.
- Fail visibly. Do not call work complete if checks were skipped, edge cases are unverified, records were ignored, or uncertainty remains.

## Change Rules

- When adding or changing behavior, add or update focused tests when practical.
- Tests should protect intent, not just output shape. A test should fail when the business rule it protects breaks.
- When changing public behavior, update the relevant docs in the same change.
- When a repeated mistake can be checked mechanically, prefer a script, lint rule, or test over another long instruction.
- For UI work, follow `BRAND_GUIDELINES.md` and verify responsive states when the change affects layout.
- For Cumulus DB work, read `apps/cumulus-db/AGENTS.md` before editing files in that tree.

## Commands

Use the narrowest command that proves the change:

```bash
npm run lint
npm run license:check
npm run test
npm run db:test
npm run build
```

Additional scoped checks:

```bash
npm run legal:lint
npm run legal:links
npm run docs:lint
npm run marketing:lint
npm run security:scan
npm run test:e2e
```

For local development:

```bash
npm install
npm run dev
npm run db:build
npm run db:start
```

## Release Versions

Release tags use bare versions, not a leading `v`. After `0.0.7`, the next releases must be `0.0.8`, `0.0.9`, `0.1.0`, `0.1.1`, and then continue forward in normal semantic-version order.

When the `release` skill is used, check `CHANGELOG.md`, `README.md`, and `docs/releasing.md`, then keep the release ladder above intact unless the user asks for a different version line.

## Documentation

Write docs for users who may not know this codebase. Use plain language. Explain what a setting does, when it is required, where it belongs, and whether it is public repo config or private overlay config.
