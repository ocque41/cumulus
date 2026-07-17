# Self-hosting Cumulus

Cumulus is a React/Vite application with small server-side notification endpoints. Vercel hosts the static app and functions; Resend stores notification Contacts and consent and delivers email.

## Trust boundary

The browser bundle receives only `NEXT_PUBLIC_SITE_URL`. All Resend credentials and resource IDs, sender configuration, postal address, GitHub token, publish secret, notification signing secret, and licensed font configuration are server-only. Do not expose them through `import.meta.env` or commit them.

The public repository does not include Alcyone Medium. Without private configuration, body copy uses the bundled Jacquard 12 fallback. A self-hoster may supply `ALCYONE_MEDIUM_WOFF2_BASE64` only after obtaining a suitable license for their own single Production website; the same-origin route necessarily delivers those font bytes to the browser, so the value is a licensing boundary rather than a secret. Keep it unset in Local and Preview and never copy the font, archive, license PDF, or encoded value into Git or static build assets.

## Setup

1. Install Node.js 24 and run `npm ci`.
2. Copy `.env.example` to the untracked `.env.local` for local work.
3. In Resend, create a dedicated Cumulus Segment and a dedicated new-log Topic whose default subscription is `opt_out`.
4. Configure the Segment and Topic IDs, API key, verified sender, webhook secret, truthful postal address, and independent random signing/publish secrets directly in Vercel.
5. If independently licensed, configure `ALCYONE_MEDIUM_WOFF2_BASE64` in Production scope only after confirming the covered domain; otherwise retain the Jacquard fallback.
6. Configure a Resend webhook for `email.bounced`, `email.complained`, and `email.suppressed` at `/api/notifications/resend-webhook`.
7. Run `npm run verify` and `npm run test:e2e` before using real recipients.

The placeholder environment serves the public site with Jacquard fallback typography, while notification functions fail closed. Outlook is neither required nor modified. Keep provider identifiers, licensed font material, and lifecycle evidence in a private operational record.

## Publication

Call `/api/notifications/publish` from trusted server-side operator tooling with a Bearer `NOTIFICATION_PUBLISH_SECRET` and `{ "slug": "published-post-slug", "dryRun": true }` first. A real send uses `dryRun: false`. The endpoint reads the published post from the code artifact; callers cannot inject email HTML. The provider resource check and stable Broadcast identity prevent accidental fanout to the wrong audience or duplicate content.
