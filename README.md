# Cumulus

Cumulus 0.0.8 is a public log-style blog built from scratch with React and Vite. It presents a high-contrast Jacquard editorial interface with Alcyone Medium reading copy on the licensed Production website, and lets readers opt in to email when a new post is published. Notification signup is the complete reader identity scope; there are no public profiles, social accounts, or content-management credentials in the browser app.

The selected production design lives on `request/cumulus-original` and is published through `main`. The literal source-layout study remains available on `request/jacquard-reference`; shared product, content, accessibility, and security behavior belongs on both branches.

## Status and assumptions

This repository defines the public application and its public-safe integration contracts. Production deployment and provider behavior are recorded separately because a Git commit alone cannot prove external state.

- The existing Vercel project and `cumulush.com` domain were retained; no replacement project or domain was created, and no private provider identifiers are stored in Git.
- `main` is the authorized production branch. The pre-redesign Git state remains preserved on an archive branch, and the two design branches remain reviewable.
- Resend Contacts, a dedicated Segment, and an opt-out-by-default Topic are the notification preference store and delivery boundary. Keys and provider-account identifiers stay in the deployment control plane, not this repository.
- Production notification publishing intentionally fails closed until `NOTIFICATION_POSTAL_ADDRESS` and `RESEND_WEBHOOK_SECRET` are configured and a controlled sign-in, receipt, unsubscribe, and suppression lifecycle is verified.

See [Vercel cutover](docs/vercel-cutover.md) for the gate sequence and [private overlay](docs/private-overlay.md) for the public/private split.

The public execution record lives in the [planning index](planning/README.md). Agent handoffs and the installed third-party instruction inventory live in [agents](agents/README.md), and [`project-post-research`](skills/project-post-research/SKILL.md) defines the reusable evidence-first content workflow. These artifacts describe work and gates; the [completion matrix](planning/requirement-evidence-matrix.md) is the place to attach proof.

## Stack

- React 19
- Vite 6
- Resend for notification contacts, preferences, suppression, and new-post delivery
- Vercel for the anticipated web and server-function deployment
- Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9, supplied under SIL OFL 1.1
- Alcyone Medium for Production reading copy, supplied under a separate commercial one-website webfont license and never bundled in this repository

This is not a Next.js application. The `NEXT_PUBLIC_*` environment names are compatibility names intentionally exposed through Vite's configured `envPrefix`.

## Local setup

Requirements:

- Node.js 24 LTS and npm;
- a Resend test key only when testing delivery from a server environment.

Install and start the browser application:

```bash
npm install
cp .env.example .env.local
npm run dev
```

Replace only the local placeholders you need. Never commit `.env.local`. Browser code may read only these intentionally public values:

- `NEXT_PUBLIC_SITE_URL`

The following values are server-only and must never be referenced through `import.meta.env` in client code:

- `ALCYONE_MEDIUM_WOFF2_BASE64`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `RESEND_NOTIFICATION_SEGMENT_ID`
- `RESEND_NOTIFICATION_TOPIC_ID`
- `GITHUB_ACCESS_TOKEN`
- `NOTIFICATION_FROM_EMAIL`
- `NOTIFICATION_POSTAL_ADDRESS`
- `NOTIFICATION_PUBLISH_SECRET`
- `NOTIFICATION_UNSUBSCRIBE_SECRET`

`ALCYONE_MEDIUM_WOFF2_BASE64` is a licensing boundary rather than a browser secret: the configured WOFF2 is necessarily delivered to readers through the same-origin font route. Leave the value empty for Local and Preview. The authorized operator sets it only in the Production environment for the single licensed website; other operators must obtain their own suitable license. A missing value fails closed at the route and the interface uses its bundled Jacquard fallback.

`NOTIFICATION_PUBLISH_SECRET` is the admin/publishing boundary for triggering a new-post send. `NOTIFICATION_UNSUBSCRIBE_SECRET` is retained as a compatibility name and signs notification-only magic links and HttpOnly sessions. Deployment credentials are operator credentials rather than app runtime settings; keep them in the provider, an approved secret manager, or an authenticated CLI session, never in this repository.

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

`npm run build` creates the browser bundle plus route-specific static HTML for the home page, public-work directory, notification-privacy page, archive, every published log, auth callback, and 404 response. It also emits `robots.txt` and `sitemap.xml`. `npm run test:e2e` may require a local server or an explicitly selected preview URL, depending on the test configuration. Do not point end-to-end tests that create contacts or send mail at production without approval and test-recipient safeguards.

## Production path

The production workflow is:

1. Install exactly from the lockfile with `npm ci`.
2. Run lint, type checking, unit tests, security scanning, license checks, and the production build.
3. Configure a dedicated Resend Segment and opt-out-by-default Topic, then set their IDs and all secrets directly in Vercel; never store values in Git.
4. Publish a candidate branch without the commercial font value, inspect its Jacquard fallback, and run end-to-end tests with approved synthetic recipients.
5. Merge the selected `request/cumulus-original` commit into `main` only with explicit publication approval.
6. After confirming the licensed production domain, set the Alcyone WOFF2 value in Production scope only and promote with the separate production approval.
7. Verify the exact production deployment, same-origin font delivery, direct-route refreshes, static metadata, sitemap, 404 behavior, and domain alias.
8. Verify sign-in and one controlled Resend lifecycle only after the truthful postal address and webhook signing secret are present.

Do not create a replacement Vercel project merely to deploy this branch. Retaining the same external Vercel project and Git integration is what preserves its project-level settings and domain association. Re-verify the existing project and domain immediately before cutover because a repository commit cannot prove current provider state.

## Product behavior

The public experience is intentionally narrow:

- a hero and chronological public logs;
- a first-party public-work directory with reviewed dates, public-source snapshots where available, and explicit private-source boundaries;
- a reader-controlled email opt-in for new posts;
- a preference/unsubscribe path that does not require a content account;
- a privileged, server-side publication notification trigger.

Consent, idempotency, unsubscribe behavior, and operational delivery rules are specified in [notifications](docs/notifications.md).
Reader-facing notification data boundaries and the manual correction/deletion contact are published at `/privacy`.

## Design and licensing

The visual system uses pure black, neutral gray typography, and very small touches of `#ff4d00`. Only the three bundled non-charted Jacquard fonts, the externally supplied Production-only Alcyone Medium webfont, and the approved dither/blur component vocabulary may be used. See [brand guidelines](BRAND_GUIDELINES.md).

Repository code is Apache-2.0. The bundled Jacquard font files remain under SIL OFL 1.1 and retain their upstream license text. Alcyone Medium remains outside Git and the Apache-2.0 distribution under its separate commercial license. No AGPL source is included. See [licensing](docs/licensing.md), [NOTICE](NOTICE), and [trademarks](TRADEMARKS.md).

## Security

Read [SECURITY.md](SECURITY.md) before reporting a vulnerability. Never place keys, real subscriber addresses, delivery logs, production identifiers, or private dashboard links in a public issue.
