# Self-Hosting Cumulus

Self-hosting gives you control over the app, auth provider, database, and Cumulus DB service. Cumulus Cloud is the easier path if you do not want to run infrastructure.

## Minimum Services

- Node.js 20+
- A Next.js hosting target
- Supabase-compatible auth/database configuration
- Cumulus DB service for agent workspace storage
- Optional Stripe configuration for billing

## License Note

The root Cumulus app is Apache-2.0. The self-hosted Cumulus DB provider in `apps/cumulus-db` is AGPL-3.0-only. If you modify Cumulus DB and run it as a network service, treat those provider changes as AGPL-covered.

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run db:build
npm run db:start
npm run dev
```

Use placeholders from `.env.example`. Do not commit your local `.env.local`.

## Cumulus DB Access

The public dashboard does not use the Cumulus DB master key. Connect with:

- database id,
- scoped bearer token.

The master key is for provisioning and private administration only.

## Cloud API Path

Use Cumulus Cloud/API when you want Cumulus to host the database and operational systems for you. Set the cloud API values from `.env.example` in your deployment environment.
