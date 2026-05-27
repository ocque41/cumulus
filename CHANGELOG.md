# Changelog

All notable changes to Cumulus are documented here.

This project follows semantic versioning. Release tags use bare versions such as `0.0.7`.

## [0.0.7] - 2026-05-27

Cumulus 0.0.7 refocuses the public site on Cumulus Create and packages the current public repo work into one clear release. The main message is now one command: `npm create @cmls@latest my-acme`.

### Added

- **Cumulus Create site** - Rebuilt the public marketing routes around the create command, template choices, auth modes, Cumulus DB modes, defaults, flags, and examples.
- **Command playground** - Turned `/dashboard` into a public command builder with copy support for template, auth, database, feature, package manager, install, git, dry-run, and runtime choices.
- **Create command data** - Added shared command-building helpers and tests for defaults, explicit flags, company handling, feature toggles, install runtimes, and dry-run behavior.
- **Cumulus DB contracts** - Added approval, audit, plan, snapshot, state, IR, and manifest schemas plus transaction contracts and tests for the local Cumulus DB service.
- **Release assets** - Added curated public images and local fonts used by the Cumulus Create website.

### Changed

- **Public navigation** - Simplified the website header, footer, dashboard sidebar, metadata, and old marketing routes so they point to Cumulus Create.
- **Cumulus Create motion** - Added Anime.js timelines, staggered reveals, command highlights, floating visuals, and scroll-linked section motion.
- **Terminal site** - Updated terminal-site copy, rendering, documentation, and tests for the current Cumulus Create direction.
- **Release hygiene** - Ignored raw local asset drops and scratch files while keeping the curated runtime assets visible for release.

### Removed

- **Old marketing surfaces** - Removed stale product pages and old home visual shells that no longer match the Cumulus Create release direction.
- **Dashboard distractions** - Removed the dashboard database link from navigation and redirects `/dashboard/database` back to the command playground.

## [0.0.6] - 2026-05-19

Cumulus 0.0.6 completed the public foundation for Cumulus DB v1 and Nimbus. It kept the Apache app boundary clean, moved provider logic into the AGPL service, and made the local developer path prove identity, system grants, schema planning, snapshots, revert, JSONL, PostgreSQL, CLI, OpenAPI, and browser console behavior.

### Added

- **PostgreSQL hosted engine** - Added the runtime Postgres storage engine, `cumulus_data` schema, auto-migration wiring, advisory locking, and JSONL/Postgres conformance tests.
- **Nimbus language tooling** - Added local imports, structured diagnostics, formatter/check/compile CLI commands, canonical JSON Schema, and OpenAPI 3.1 system contracts.
- **Cumulus auth and system API** - Added OIDC discovery, auth code + PKCE, device flow, restricted token exchange, org claim, passkey step-up, grants, agent lifecycle, approval, audit, and rate-limit endpoints.
- **System console and safe proxy** - Rebuilt `/dashboard/system` around Cumulus DB operations and added an app-side `/api/cumulus-db/system/*` proxy that forwards only user bearer tokens.
- **CLI and MCP surface** - Added Cumulus CLI commands for login, agent init, whoami, schema plan/approval/apply/revert, snapshots, grants list/set, audit tail, token rotation, and Nimbus passthrough.
- **Encrypted snapshot foundation** - Added per-snapshot DEK encryption with AES-256-GCM metadata authentication and provider-side wrapped DEK storage for local development.

### Changed

- **Terminal create docs** - Advertised the `create-cumulus` package from the terminal home page and expanded the terminal Documents page into install and usage guidance.
- **Release-ready docs** - Documented Postgres setup, auth mode selection, private overlay boundaries, snapshot KEK handling, system UI, CLI, machine contracts, and public release checks.

## [0.0.5] - 2026-05-13

### Changed

- **Terminal polish** - Added ASCII Cumulus branding to the terminal site header and replaced the side navigation with a horizontal link row.
- **Footer coverage** - Expanded the website footer to cover marketing, workspace, account, package, and legal links.

## [0.0.4] - 2026-05-13

Initial terminal website package release.

### Added

- **Terminal website** - Added the public terminal package for running the Cumulus website as a TUI.
- **Terminal pages** - Added terminal pages for Cumulus, Documents, Relay, Tado, Rune, and Contact.
- **Contact flow** - Added a local email draft flow for `hi@cumulush.com` without shipping email service secrets.

## [0.0.3] - 2026-05-13

Cumulus 0.0.3 turned the database dashboard into a fuller operational console. The release closed browser-visible gaps around provider health, MCP metadata, token handling, backup, compaction, and compact record views while keeping public routes scoped to database tokens.

### Added

- **Database operations dashboard** - Expanded `/dashboard/database` with provider health, MCP metadata, key-value, events, token management, backup, compact, and compact record views.
- **Cumulus DB API coverage** - Added app-side proxy routes for health, MCP metadata, events, key-value, token list/create/rotate/revoke, backup, and compact operations.
- **Browser polish** - Added favicon coverage, stable theme hydration, form-wrapped token input, and clearer admin-scope hints for secret reveal and maintenance actions.

### Fixed

- **Local Cumulus DB config** - Made generated and local env parsing tolerate narrow test env objects and empty optional values.
- **Release hygiene** - Ignored local session archives so saved transcripts do not enter public release scans or commits.

## [0.0.2] - 2026-05-12

Cumulus 0.0.2 made the database API observable from the public dashboard. A connected workspace could prove record-type storage, event writes, key-value writes, secret handling, and search behavior without exposing the master key.

### Added

- **Database evidence console** - Added `/dashboard/database` controls to seed sample records for every supported Cumulus DB record type and show coverage directly in the dashboard.
- **Search proof controls** - Added dashboard search inputs for text query, vector query, type filtering, and result limits with score breakdowns.
- **Cumulus DB API proxies** - Added app-side token-protected routes for Cumulus DB event writes and key-value reads/writes.
- **Cumulus DB proof tests** - Added HTTP tests that store every public record type and verify text, vector, type, and limit search behavior.

### Changed

- **MCP database tools** - Implemented the advertised `cumulus_db_put_kv`, `cumulus_db_get_kv`, and `cumulus_db_reveal_secret` tools and extended MCP search to accept type and limit arguments.
- **Docs validation** - Made docs lint skip the optional `src/content/docs` tree when that content root is not present.

## [0.0.1] - 2026-05-12

Initial public release of Cumulus as a cloud-first, self-hostable product codebase.

### Added

- **Public Next.js app** - Added marketing pages, product pages, cloud setup, docs, auth flow, billing hooks, dashboard, and Cumulus DB integration.
- **Public Cumulus Database provider** - Added local storage, tokens, search, secrets, HTTP routes, tests, and smoke tooling.
- **Local auth package** - Added the local `@cumulus/auth` source package to replace the private package tarball.
- **Self-host setup** - Added the public Supabase baseline migration and pasteable `app_schema.sql`.
- **Public docs and policies** - Added cloud-first and self-hosted documentation, private production overlay guidance, trademark policy, security policy, contributing guide, and license boundary documentation.

### Removed

- **Private-only material** - Removed internal agent definitions, private planning notes, MCP/project refs, local runtime data, private tarballs, production-only scripts, and stale design-debugging artifacts from the public export.
