# Cumulus

Cumulus 0.0.8 is a public log-style blog built from scratch with React and Vite. It presents a high-contrast Jacquard editorial interface and lets readers opt in to email when a new post is published. Notification signup is the complete reader identity scope; there are no public profiles, social accounts, or content-management credentials in the browser app.

The reference implementation lives on the literal branch `request/jacquard-reference`.

## Status and assumptions

This repository defines the fresh public application and its public-safe integration contracts. It does not prove current production state.

- An authenticated provider inspection verified the existing Vercel `cloud` project and its `cumulush.com` domain association. No provider IDs or domain-control values are stored in Git.
- The connected Git repository, final deployment commit, and live production behavior still require separate release evidence.
- The public Supabase migration is additive by design. Running it against a live database is a separate approval gate.
- Resend is the anticipated delivery provider. Real sender verification, API keys, suppression records, and provider-account details are private operations.
- Previewing `request/jacquard-reference` is allowed only when publication is authorized; replacing `main`, pushing, migrating production, and cutting over the live domain each require explicit approval.

See [Vercel cutover](docs/vercel-cutover.md) for the gate sequence and [private overlay](docs/private-overlay.md) for the public/private split.

The public execution record lives in the [planning index](planning/README.md). Agent handoffs and the installed third-party instruction inventory live in [agents](agents/README.md), and [`project-post-research`](skills/project-post-research/SKILL.md) defines the reusable evidence-first content workflow. These artifacts describe work and gates; the [completion matrix](planning/requirement-evidence-matrix.md) is the place to attach proof.

## Stack

- React 19
- Vite 6
- Supabase for subscriber state
- Resend for new-post delivery
- Vercel for the anticipated web and server-function deployment
- Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9, supplied under SIL OFL 1.1

This is not a Next.js application. The `NEXT_PUBLIC_*` environment names are compatibility names intentionally exposed through Vite's configured `envPrefix`.

## Local setup

Requirements:

- a current Node.js LTS release and npm;
- a Supabase project or local Supabase environment if testing persisted subscriptions;
- a Resend test key only when testing delivery from a server environment.

Install and start the browser application:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Replace only the local placeholders you need. Never commit `.env.local`. Browser code may read only these intentionally public values:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The following values are server-only and must never be referenced through `import.meta.env` in client code:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `GITHUB_ACCESS_TOKEN`
- `NOTIFICATION_FROM_EMAIL`
- `NOTIFICATION_POSTAL_ADDRESS`
- `NOTIFICATION_PUBLISH_SECRET`
- `NOTIFICATION_UNSUBSCRIBE_SECRET`

`NOTIFICATION_PUBLISH_SECRET` is the admin/publishing boundary for triggering a new-post send. Deployment credentials, such as Vercel or Supabase CLI tokens, are operator credentials rather than app runtime settings; keep them in the provider, an approved secret manager, or an authenticated CLI session, never in this repository.

`SUPABASE_SERVICE_ROLE_KEY` is retained as a compatibility name. It accepts a current Supabase secret/server key or a legacy service-role JWT; the server adapter avoids sending current `sb_secret_` keys in an `Authorization` header.

`NOTIFICATION_POSTAL_ADDRESS` is private operational configuration, but it is rendered in every notification footer. Supply a truthful address that satisfies the operator's applicable email rules; the server fails closed when it is missing. Do not put a fabricated address in Production.

`GITHUB_ACCESS_TOKEN` authorizes only the server-side contribution-calendar request for the fixed `ocque41` profile. Use a separate least-privilege viewer identity with no private-repository access, then compare the result with the public profile. Do not use an owner-wide `ocque41` credential.

## Commands

Use the focused checks during development and run the complete set before a release or production preview:

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
npm run audit:deps
npm run security:scan
npm run license:check
npm run test:e2e
```

`npm run build` creates the production browser bundle. `npm run test:e2e` may require a local server or an explicitly selected preview URL, depending on the test configuration. Do not point end-to-end tests that create subscriptions or send mail at production without approval and test-recipient safeguards.

## Production path

The anticipated production workflow is:

1. Install exactly from the lockfile with `npm ci`.
2. Run lint, type checking, unit tests, security scanning, license checks, and the production build.
3. Review the additive SQL under `supabase/migrations/` against a non-production Supabase project.
4. configure the public and server-only variables in the existing Vercel project's Preview environment;
5. push `request/jacquard-reference` only after push approval and inspect its Vercel preview;
6. run end-to-end tests against that preview without using live customer records;
7. obtain separate approval for the live migration;
8. obtain separate approval to replace or merge into `main` and promote the proven deployment.

Do not create a replacement Vercel project merely to deploy this branch. Retaining the same external Vercel project and Git integration is what preserves its project-level settings and domain association. Re-verify the existing project and domain immediately before cutover because a repository commit cannot prove current provider state.

## Product behavior

The public experience is intentionally narrow:

- a hero and chronological public logs;
- a reader-controlled email opt-in for new posts;
- a preference/unsubscribe path that does not require a content account;
- a privileged, server-side publication notification trigger.

Consent, idempotency, unsubscribe behavior, and operational delivery rules are specified in [notifications](docs/notifications.md).

## Design and licensing

The visual system uses pure black, neutral gray typography, and very small touches of `#ff4d00`. Only the three supplied non-charted fonts and the approved dither/blur component vocabulary may be used. See [brand guidelines](BRAND_GUIDELINES.md).

Repository code is Apache-2.0. The font files remain under SIL OFL 1.1 and retain their upstream license text. No AGPL source is included. See [licensing](docs/licensing.md), [NOTICE](NOTICE), and [trademarks](TRADEMARKS.md).

## Security

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability. Never place keys, real subscriber addresses, delivery logs, production identifiers, or private dashboard links in a public issue.
