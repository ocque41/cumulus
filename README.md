# Cumulus

Cumulus 0.0.8 is a public log-style blog built from scratch with React and Vite. It presents a high-contrast Jacquard editorial interface and lets readers opt in to email when a new post is published. Notification signup is the complete reader identity scope; there are no public profiles, social accounts, or content-management credentials in the browser app.

The selected production design lives on `request/cumulus-original` and is published through `main`. The literal source-layout study remains available on `request/jacquard-reference`; shared product, content, accessibility, and security behavior belongs on both branches.

## Status and assumptions

This repository defines the public application and its public-safe integration contracts. Production deployment and provider behavior are recorded separately because a Git commit alone cannot prove external state.

- The existing Vercel project and `cumulush.com` domain were retained; no replacement project or domain was created, and no private provider identifiers are stored in Git.
- `main` is the authorized production branch. The pre-redesign Git state remains preserved on an archive branch, and the two design branches remain reviewable.
- The additive Supabase notification migrations have been applied and their tables, policies, and indexes inspected. This does not by itself prove a complete email lifecycle.
- Resend is the delivery provider. Keys and provider-account details stay in the deployment control plane, not this repository.
- Production notification publishing intentionally fails closed until `NOTIFICATION_POSTAL_ADDRESS` and `RESEND_WEBHOOK_SECRET` are configured and a controlled sign-in, receipt, unsubscribe, and suppression lifecycle is verified.

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

- Node.js 24 LTS and npm;
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
- `RESEND_WEBHOOK_SECRET`
- `GITHUB_ACCESS_TOKEN`
- `NOTIFICATION_FROM_EMAIL`
- `NOTIFICATION_POSTAL_ADDRESS`
- `NOTIFICATION_PUBLISH_SECRET`
- `NOTIFICATION_UNSUBSCRIBE_SECRET`

`NOTIFICATION_PUBLISH_SECRET` is the admin/publishing boundary for triggering a new-post send. Deployment credentials, such as Vercel or Supabase CLI tokens, are operator credentials rather than app runtime settings; keep them in the provider, an approved secret manager, or an authenticated CLI session, never in this repository.

`SUPABASE_SERVICE_ROLE_KEY` is retained as a compatibility name. It accepts a current Supabase secret/server key or a legacy service-role JWT; the server adapter avoids sending current `sb_secret_` keys in an `Authorization` header.

`NOTIFICATION_POSTAL_ADDRESS` is private operational configuration, but it is rendered in every notification footer. Supply a truthful address that satisfies the operator's applicable email rules; the server fails closed when it is missing. Do not put a fabricated address in Production.

`GITHUB_ACCESS_TOKEN` is optional. When a valid token is present, it authorizes only the server-side GraphQL request for the fixed `ocque41` profile. If it is absent or GitHub rejects that request, the endpoint uses GitHub's public fixed-user contribution calendar and accepts only bounded, sequential date/count/density data. Never use an owner-wide, private-repository, or workflow credential for this public display.

## Commands

Use the focused checks during development and run the complete set before a release or production preview:

`npm run typecheck` runs both the strict application compiler and a separate NodeNext pass that mirrors Vercel's isolated function compiler. Keep both: Vercel's non-strict function pass narrows some discriminated unions differently from the strict application build.

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

`npm run build` creates the browser bundle plus route-specific static HTML for the home page, archive, every published log, auth callback, unsubscribe page, and 404 response. It also emits `robots.txt` and `sitemap.xml`. `npm run test:e2e` may require a local server or an explicitly selected preview URL, depending on the test configuration. Do not point end-to-end tests that create subscriptions or send mail at production without approval and test-recipient safeguards.

## Production path

The production workflow is:

1. Install exactly from the lockfile with `npm ci`.
2. Run lint, type checking, unit tests, security scanning, license checks, and the production build.
3. Review additive SQL under `supabase/migrations/` before applying any future migration.
4. Configure public and server-only variables in the existing Vercel project; never store values in Git.
5. Publish a candidate branch, inspect its Vercel deployment, and run end-to-end tests without real reader records.
6. Merge the selected `request/cumulus-original` commit into `main` only with explicit publication approval.
7. Verify the exact production deployment, direct-route refreshes, static metadata, sitemap, 404 behavior, and domain alias.
8. Verify sign-in and one controlled Resend lifecycle only after the truthful postal address and webhook signing secret are present.

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
