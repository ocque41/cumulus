# Notification and Vercel safety gates

These gates separate repository proof, provider configuration, and production proof.

## A — repository safety

- Only `NEXT_PUBLIC_SITE_URL` is browser-visible.
- Resend credentials/resource IDs, sender/postal configuration, optional GitHub token, and publish/session secrets are server-only.
- Source and built-asset scans must pass; no real provider value, Contact, private URL, or delivery record enters Git.

## B — identity and consent

- Sign-in is limited to notification preferences and requires explicit disclosure acceptance.
- Magic tokens are short-lived, purpose-bound, signed, and carried in the callback fragment.
- The session cookie is signed, HttpOnly, SameSite, and grants no profile or publishing role.
- Resend Contact membership is limited to the dedicated Cumulus Segment; the new-log Topic defaults to opt-out and changes only after an authenticated reader action.

## C — resilient delivery

- Publication requires a server-only Bearer secret and resolves a slug against shipped content.
- A deterministic Broadcast name and idempotency key identify one post notification.
- Existing Broadcast content is compared exactly; conflict fails closed.
- Resend expands the Segment/Topic audience and supplies unsubscribe behavior.
- Signed bounced, complained, and suppressed webhooks opt out only the Cumulus Topic for matching Cumulus Contacts.

## D — preview

Verify the existing Vercel project and Git connection without changing either. Configure Preview variables directly in Vercel, inspect the Resend Segment and opt-out-by-default Topic, and use approved synthetic recipients. After explicit push approval, verify routes, magic-link exchange, preference changes, one Broadcast, unsubscribe, webhook suppression, and absence of sensitive logs.

## E — production mutation

Treat these as separate explicit gates: push/merge, production promotion, domain change, Resend resource/webhook change, and first production Broadcast. Capture private before/after provider evidence and keep the prior deployment available. No database migration exists in this architecture. Outlook remains untouched.

## F — production verification

Verify the intended commit and domain, then one controlled sign-in, consent, receipt, unsubscribe, repeat-publication, and suppression lifecycle. A build, environment injection, or READY deployment alone is insufficient.
