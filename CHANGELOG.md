# Changelog

All notable changes to Cumulus are documented here.

This project follows semantic versioning. The root app is licensed under Apache-2.0, and the Cumulus Database provider in `apps/cumulus-db` is licensed under AGPL-3.0-only.

## [0.4.0] - 2026-05-19

Cumulus 0.4.0 is the first complete public foundation for Cumulus DB v1 and Nimbus. It keeps the Apache app boundary clean, moves provider logic into the AGPL service, and makes the local developer path prove identity, system grants, schema planning, snapshots, revert, JSONL, PostgreSQL, CLI, OpenAPI, and browser console behavior.

### Added

- **PostgreSQL hosted engine** - Added the runtime Postgres storage engine, `cumulus_data` schema, auto-migration wiring, advisory locking, and JSONL/Postgres conformance tests.
- **Nimbus language tooling** - Added local imports, structured diagnostics, formatter/check/compile CLI commands, canonical JSON Schema, and OpenAPI 3.1 system contracts.
- **Cumulus-native auth and system API** - Added OIDC discovery, auth code + PKCE, device flow, restricted token exchange, org claim, passkey step-up, grants, agent lifecycle, approval, audit, and rate-limit endpoints.
- **System console and safe proxy** - Rebuilt `/dashboard/system` around Cumulus DB operations and added an Apache-side `/api/cumulus-db/system/*` proxy that forwards only user bearer tokens.
- **CLI and MCP surface** - Added Cumulus CLI commands for login, agent init, whoami, schema plan/approval/apply/revert, snapshots, grants list/set, audit tail, token rotation, and Nimbus passthrough, plus structured MCP tool schemas.
- **Encrypted snapshot foundation** - Added per-snapshot DEK encryption with AES-256-GCM metadata authentication and provider-side wrapped DEK storage for local development.
- **Release-ready docs** - Documented Postgres setup, auth mode selection, private overlay boundaries, snapshot KEK handling, system UI, CLI, machine contracts, and public release checks.

## [cumulush@0.1.2] - 2026-05-14

### Changed

- Advertised the published `create-cumulus` package from the terminal home page.
- Expanded the terminal Documents page into a `create-cumulus` install and usage guide.
- Documented templates, agent auth modes, Cumulus DB modes/defaults, flags, local DB scripts, and license boundaries.

## [cumulush@0.1.1] - 2026-05-13

### Changed

- Added ASCII Cumulus branding to the terminal site header.
- Added an ASCII Tado mark to the `/tado` terminal page.
- Replaced the terminal site's side navigation with a horizontal link row for the six pages.
- Expanded the website footer to cover marketing, workspace, account, package, and legal links.

## [cumulush@0.1.0] - 2026-05-13

Initial terminal website package release.

### Added

- Public npm package in `packages/terminal-site` for running the Cumulus website as a TUI.
- Terminal pages for Cumulus, Documents, Relay, Tado, Rune, and Contact.
- Contact flow that opens a local email draft to `hi@cumulush.com` without shipping email service secrets.
- Home page and docs page references for running `npx cumulush`.

## [0.3.0] - 2026-05-13

Cumulus 0.3.0 turns the database dashboard into a fuller operational console. The release closes the remaining browser-visible gaps around provider health, MCP metadata, token handling, backup, compaction, and compact record views while keeping public routes scoped to database tokens.

### Added

- **Database operations dashboard** - Expanded `/dashboard/database` with provider health, MCP metadata, key-value, events, token management, backup, compact, and compact record views.
- **Cumulus DB API coverage** - Added app-side proxy routes for health, MCP metadata, events, key-value, token list/create/rotate/revoke, backup, and compact operations.
- **Browser polish** - Added favicon coverage, stable theme hydration, form-wrapped token input, and clearer admin-scope hints for secret reveal and maintenance actions.

### Fixed

- **Local Cumulus DB config** - Made generated and local env parsing tolerate narrow test env objects and empty optional values.
- **Release hygiene** - Ignored local session archives so saved transcripts do not enter public release scans or commits.

## [0.2.0] - 2026-05-12

Cumulus 0.2.0 makes the database API observable from the public dashboard. A connected workspace can now prove record-type storage, event writes, key-value writes, secret handling, and search behavior without exposing the master key.

### Added

- **Database evidence console** - Added `/dashboard/database` controls to seed sample records for every supported Cumulus DB record type and show coverage directly in the dashboard.
- **Search proof controls** - Added dashboard search inputs for text query, vector query, type filtering, and result limits with score breakdowns.
- **Cumulus DB API proxies** - Added app-side token-protected routes for Cumulus DB event writes and key-value reads/writes.
- **Cumulus DB proof tests** - Added HTTP tests that store every public record type and verify text, vector, type, and limit search behavior.

### Changed

- **MCP database tools** - Implemented the advertised `cumulus_db_put_kv`, `cumulus_db_get_kv`, and `cumulus_db_reveal_secret` tools and extended MCP search to accept type and limit arguments.
- **Docs validation** - Made docs lint skip the optional `src/content/docs` tree when that content root is not present.

## [0.1.0] - 2026-05-12

Initial public release of Cumulus as a cloud-first, self-hostable product codebase.

### Added

- Public Next.js app with marketing pages, product pages, cloud setup, docs, auth flow, billing hooks, dashboard, and Cumulus DB integration.
- Public-safe Cumulus Database provider in `apps/cumulus-db`, licensed AGPL-3.0-only, with local storage, tokens, search, secrets, HTTP routes, tests, and smoke tooling.
- Local `@cumulus/auth` source package in `packages/auth`, replacing the private package tarball.
- Public Supabase baseline migration and pasteable `app_schema.sql` for self-hosted installs.
- Cloud-first and self-hosted documentation, including private production overlay guidance.
- Apache-2.0 root license, AGPL-3.0-only Cumulus DB license, trademark policy, security policy, contributing guide, and license boundary documentation.
- Public release automation for secret scanning, license-boundary checks, and fresh-history exports.

### Changed

- Cumulus DB routes now use scoped bearer-token access for public user flows, while master/admin access stays private-overlay only.
- Legal/provider content now uses public templates and points hosted-service users to current Cumulus Cloud policies.
- Public docs and agent instructions now separate shared open-source work from private production-only systems.

### Removed

- Internal agent definitions, private planning notes, MCP/project refs, local runtime data, private tarballs, production-only scripts, and stale design-debugging artifacts from the public export.
- Hardcoded private provider refs, private tenant IDs, old subdomain test assumptions, and private package registry config.
