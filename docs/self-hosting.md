# Self-hosting Cumulus

Cumulus is a React/Vite application with small server-side notification endpoints. Vercel hosts the static app and functions; Resend stores notification Contacts and consent and delivers email.

## Trust boundary

The browser receives only `NEXT_PUBLIC_SITE_URL`. All Resend credentials and resource IDs, sender configuration, postal address, GitHub token, publish secret, and notification signing secret are server-only. Do not expose them through `import.meta.env` or commit them.

## Setup

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to the untracked `.env.local` for local work.
3. In Resend, create a dedicated Cumulus Segment and a dedicated new-log Topic whose default subscription is `opt_out`.
4. Configure the Segment and Topic IDs, API key, verified sender, webhook secret, truthful postal address, and independent random signing/publish secrets directly in Vercel.
5. Configure a Resend webhook for `email.bounced`, `email.complained`, and `email.suppressed` at `/api/notifications/resend-webhook`.
6. Run `npm run verify` and `npm run test:e2e` before using real recipients.

The placeholder environment serves the public site but notification functions fail closed. Outlook is neither required nor modified. Keep provider identifiers and lifecycle evidence in a private operational record.

## Publication

Call `/api/notifications/publish` from trusted server-side operator tooling with a Bearer `NOTIFICATION_PUBLISH_SECRET` and `{ "slug": "published-post-slug", "dryRun": true }` first. A real send uses `dryRun: false`. The endpoint reads the published post from the code artifact; callers cannot inject email HTML. The provider resource check and stable Broadcast identity prevent accidental fanout to the wrong audience or duplicate content.

When using the included GitHub/Vercel automation, add the same Production publication secret to GitHub Actions as `NOTIFICATION_PUBLISH_SECRET`. Vercel's Git integration sends a `vercel.deployment.success` repository-dispatch event after deployment. The workflow runs only for the `production` environment, reconciles published slugs outside the fixed pre-automation baseline, waits for the canonical endpoint to recognize each slug, dry-runs, and then publishes idempotently. Keep Preview secrets separate; Preview deployments are intentionally ignored.
