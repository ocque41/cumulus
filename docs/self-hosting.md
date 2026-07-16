# Self-hosting Cumulus

Cumulus 0.0.8 can be self-hosted as a Vite browser application with small server-side notification endpoints, Supabase subscriber storage, and Resend delivery. Vercel is the anticipated host, but the public interfaces are provider-neutral.

## Architecture

The browser serves the public logs and submits notification preferences with the public Supabase project URL and anonymous key. Privileged publication, unsubscribe signing, service-role database access, and Resend calls run only in a server environment.

The trust boundary is important:

- browser: `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` only;
- server: Supabase service role, Resend key, dedicated public-profile GitHub token, postal address, publish secret, and unsubscribe signing secret;
- operator: deployment credentials, provider dashboards, live migration approval, and production data.

## 1. Build locally

Install a current Node.js LTS release and npm, then:

```bash
npm install
cp .env.example .env.local
npm run dev
```

The placeholder environment starts the static UI but cannot create real subscriptions or deliver mail. Use a non-production Supabase project and Resend test configuration for integration work.

Before deploying:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run audit:deps
npm run security:scan
npm run license:check
```

The browser build output is `dist/`.

## 2. Prepare Supabase

Review the SQL files under `supabase/migrations/` before applying them. The Cumulus notification migration is expected to be additive: it may add dedicated tables, indexes, functions, triggers, and row-level policies, but it must not drop, rename, truncate, or rewrite unrelated existing objects.

For a new self-hosted project:

1. create a Supabase project or local Supabase stack;
2. apply the migrations in filename order using the Supabase CLI or SQL editor;
3. verify row-level security with the anonymous key;
4. verify privileged notification operations only from the server with a current Supabase secret/server key or legacy service-role JWT;
5. exercise subscribe, repeat subscribe, unsubscribe, and repeat unsubscribe against synthetic addresses.

For an existing or production database, first take a provider-supported backup, inspect the execution plan and lock impact, and prove the migration against a representative non-production database. Applying it live is an explicit approval gate; repository inclusion is not migration approval.

## 3. Configure Resend

In a private provider account:

1. verify the sender domain or use the provider's approved test sender;
2. create a narrowly scoped API key;
3. set `RESEND_API_KEY`, `NOTIFICATION_FROM_EMAIL`, and a truthful `NOTIFICATION_POSTAL_ADDRESS` only in the server environment;
4. configure authenticated bounce and complaint suppression handling before sending to real readers;
5. send a test to an approved test recipient and inspect the postal footer plus unsubscribe link.

Do not commit sender-account IDs, verification records, API keys, event payloads, or delivery logs. `NOTIFICATION_FROM_EMAIL` must use a sender the Resend account is authorized to use.

## 4. Configure notification secrets

Generate independent high-entropy values for:

- `NOTIFICATION_PUBLISH_SECRET`, which authorizes a privileged new-post notification request; and
- `NOTIFICATION_UNSUBSCRIBE_SECRET`, which signs unsubscribe tokens.

Use an approved secret generator or secret manager. Do not derive one secret from the other, reuse a personal password, print the value into logs, or place it in a `NEXT_PUBLIC_*` variable.

Rotating the unsubscribe secret can invalidate outstanding links. Plan a grace period or multi-key verifier before rotation in an active deployment.

## 5. Configure the GitHub graph

Set `GITHUB_ACCESS_TOKEN` only in the server environment. Use a token owned by a separate least-privilege viewer identity with no private-repository access; an owner credential can make private contribution counts visible to the server even when the public site should not reveal them. Compare the endpoint result with the public profile. The endpoint is fixed to `ocque41` and fails to an honest unavailable state when the token is absent or GitHub rejects the response.

## 6. Deploy

For a generic host, configure:

- build command: `npm run build`;
- browser output: `dist`;
- a Node-compatible server runtime for notification endpoints;
- HTTPS and same-origin routing for the browser and notification API;
- the exact environment contract from `.env.example`.

For the existing Vercel project, follow `docs/vercel-cutover.md`. Do not create a new project when the goal is to preserve the existing project settings and domain. This repository does not contain domain configuration and cannot verify the live linkage.

Run the end-to-end suite against a preview before production:

```bash
npm run test:e2e
```

Use only synthetic subscribers and a safe mail recipient in preview.

## Operational minimums

- Back up the subscriber store according to the retention policy.
- Rate-limit subscription and privileged publish requests.
- When publish returns HTTP `202` with `hasMore: true`, wait for `Retry-After` and repeat the identical authorized request until HTTP `200` reports completion.
- Keep a stable publication-event idempotency key across retries.
- Record provider delivery IDs without logging full recipient data.
- Honor unsubscribe before scheduling or retrying a delivery.
- Monitor bounces, complaints, server errors, and unexpected send volume.
- Rotate compromised keys and assess whether unsubscribe links require a planned verifier transition.

## Assumptions

The public implementation supplies the notification API and additive migration contract, while real provider projects and credentials are supplied by the operator. Legal requirements vary by jurisdiction; self-hosters must choose an appropriate consent, retention, and deletion policy before collecting real addresses.
