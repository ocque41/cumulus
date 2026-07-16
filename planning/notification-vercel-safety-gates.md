# Notification and Vercel safety gates

These gates separate local correctness, preview readiness, and production readiness. Repository code cannot prove provider state.

## Gate A — repository safety

- The browser may receive only intentionally public site and Supabase values.
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, optional `GITHUB_ACCESS_TOKEN`, `NOTIFICATION_PUBLISH_SECRET`, and `NOTIFICATION_UNSUBSCRIBE_SECRET` are credentials or signing material and are server-only.
- `NOTIFICATION_POSTAL_ADDRESS` is server-rendered compliance content. Its deployed value is intentionally disclosed in notification email, but it must not be committed, injected into the browser bundle, or copied into unrelated logs and screenshots.
- Secret values must not appear in Git, patches, test fixtures, screenshots, command arguments, shell history, build output, browser assets, error responses, analytics, or logs.
- `.env.example` contains names and non-secret placeholders only. Local secret files remain ignored.
- A current repository and built-asset secret scan passes before preview or production work.
- Any credential disclosed outside the approved secret channel is rotated before production use.

Proof: source review, ignore rules, build inspection, secret-scan output, and a redacted variable-name inventory.

## Gate B — identity and consent

- Sign-in is limited to confirming and managing new-post notifications.
- The consent control states what will be sent and requires an affirmative user action.
- Consent version, normalized address, status, and timestamps are stored under user-scoped RLS.
- A user can revoke consent without a password through a signed, expiring, one-click unsubscribe URL.
- Suppression takes effect before any subsequent send selection.
- Authentication errors do not reveal whether an address belongs to another account.

Proof: focused auth tests, RLS tests, consent walkthrough, unsubscribe walkthrough, and sanitized database-state inspection.

## Gate C — resilient delivery

- Publication requires a server-only bearer secret and validates the post identifier against published content.
- One publication event creates at most one successful delivery per active subscriber.
- A claim uses an expiring lease, bounded attempt count, and atomic acquisition so a crashed worker can retry safely.
- Delivery distinguishes retryable failures from terminal failures and does not retry suppressions or invalid recipients.
- Resend receives a deterministic idempotency key.
- Email HTML and text include an absolute post URL, sender identity, and one-click unsubscribe URL.
- Logs contain opaque identifiers and failure classes, not addresses, tokens, or provider credentials.
- Any webhook-driven status update verifies the provider signature before processing.

Proof: database constraint/RPC review, concurrent claim tests, crash-and-retry tests, render snapshots, API tests, and sanitized provider test-delivery evidence.

## Gate D — preview provider configuration

1. Verify the existing Vercel project identity and its Git connection without changing either.
2. Verify the configured domain and sender identity in their provider control planes; do not infer configuration from a successful DNS lookup alone.
3. Use an authenticated Vercel integration or control plane to set each secret directly in the Preview environment. Never place the value in a committed file or a command shown in logs. Configure the public site and Supabase values plus the server-only Supabase, Resend, GitHub, notification sender, postal-address, publish-secret, and unsubscribe-secret values required by the final code contract.
4. Keep Preview Supabase data isolated from production subscribers.
5. Restrict preview delivery to an allowlisted test recipient and use a non-customer test post.
6. Deploy the reference branch preview and verify direct routes, auth callback, preference changes, publication, receipt, source links, and unsubscribe.
7. Save only redacted evidence: project name if public, variable names, target environment, timestamps, deployment URL if approved for disclosure, and result.

The notification configuration enforces the `cumulush.com` site-origin and sender-domain boundary when Vercel reports the Production environment. Preview and self-hosted deployments may use their explicitly configured HTTPS origins and provider-approved test senders. Therefore, test a preview with its real preview origin rather than substituting the production origin, and do not treat preview acceptance as proof of the stricter production-domain branch.

Proof: redacted provider inspection, preview deployment checks, allowlisted delivery receipt, unsubscribe state, and absence-of-secret scan.

## Gate E — production mutation

Production changes are permitted only when the current user authorization covers the exact action. Treat these as separate operations even when one tool can perform several:

1. apply the reviewed additive Supabase migration;
2. inject or rotate production runtime secrets through the existing Vercel project;
3. push or merge the selected branch;
4. create or promote a deployment;
5. attach, move, or change the live domain;
6. trigger the first production notification.

Before mutation, capture a redacted snapshot of the existing project, environments, domain attachment, callback URL, and database migration state. After mutation, verify the same items plus rollback readiness. Do not create a replacement Vercel project.

## Gate F — production verification

- Load the live home, index, at least one post, auth callback, preferences, unsubscribe, and not-found route.
- Confirm the live domain serves the intended commit and the previous project/domain settings remain intact.
- Use a designated non-customer account to verify sign-in, consent, one controlled notification, link targets, and unsubscribe.
- Confirm a repeated publication request cannot produce a second successful delivery.
- Confirm logs and analytics remain free of email addresses, tokens, secret values, and unsubscribe URLs.
- Record rollback instructions and remove any temporary test allowlist.

Production is not complete until this gate passes. A successful build, preview, variable injection, or deployment alone is insufficient.
