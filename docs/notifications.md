# New-post notifications

Cumulus uses reader identity only to manage new-post email notifications. Any sign-up, sign-in, or login language in the interface refers to notification preferences; it does not create a public profile, content account, social identity, or publishing role.

## Reader promise

Before collecting an address, the interface must plainly say:

- the address is used to notify the reader when a new log is published;
- messages include an unsubscribe path;
- subscribing is optional and is not required to read public logs;
- the privacy or contact information appropriate to the operator's jurisdiction is available.

The form must require an explicit submission. Do not use pre-checked consent, subscription bundled with an unrelated action, scraped addresses, purchased lists, or an address inferred from another account.

## Subscription behavior

The server should normalize an address consistently, validate it conservatively, and rely on a database uniqueness constraint as the final concurrency boundary. Never use a browser-only duplicate check as proof of uniqueness.

A repeated request for the same active address is idempotent: it returns a neutral success response without adding another active subscription. A previously unsubscribed address may be reactivated only after a new explicit opt-in and a new consent timestamp.

Store only what the notification function needs, such as normalized address, state, consent timestamp/version, unsubscribe-token metadata, and delivery/idempotency state. Do not add profile or behavioral fields by convenience.

Responses should not make address enumeration easy. Rate-limit by appropriate privacy-preserving request signals and record abuse without logging raw secrets or unnecessary personal data.

## Preference access and unsubscribe

Preference access should use a scoped, expiring or revocable signed link rather than a reusable content-account password. The link grants only the ability to view or change that address's notification preference.

Every notification must include an understandable unsubscribe action. The token is signed server-side with `NOTIFICATION_UNSUBSCRIBE_SECRET`; the secret and raw token must not appear in application logs or browser bundles.

Unsubscribe must:

1. validate the token and its intended address/scope;
2. change the subscription to an inactive or unsubscribed state;
3. be safe to repeat;
4. prevent new sends and queued retry attempts;
5. show a neutral result without exposing other subscriber data.

Automated email scanners may follow links. Prefer a confirmation page plus a deliberate POST for the human-facing action, and implement standards-based one-click unsubscribe separately if the delivery provider and applicable requirements call for it.

## Publishing and delivery

Only a server-side publisher may trigger delivery. The publish action requires `NOTIFICATION_PUBLISH_SECRET` and must use constant-time secret comparison where the runtime permits. Never put the secret in `NEXT_PUBLIC_*`, a client request embedded in the page, a URL query, or a log.

Each publication event needs a stable idempotency key, for example a durable post identifier plus the notification revision. The system must persist the event and enforce at most one delivery record per event and subscriber. A network timeout or Resend retry must reuse the same key instead of creating a new event.

Before each send or retry:

- confirm the subscription is still active;
- claim or read the unique event/subscriber delivery record atomically;
- send through Resend with `RESEND_API_KEY` and `NOTIFICATION_FROM_EMAIL` on the server;
- include the configured `NOTIFICATION_POSTAL_ADDRESS` in both HTML and text footers;
- store the provider message ID and minimal status needed for operations;
- never log the API key, publish secret, unsubscribe signing secret, or a full recipient list.

Handle partial failure explicitly. A provider timeout is an unknown result until reconciled; do not blindly resend. Bounces and complaints must suppress future sends according to provider guidance and the operator's policy.

The publish endpoint is a bounded dispatcher, not a single unbounded fanout request. It reserves globally paced provider slots, makes at most 40 provider attempts, and stops early when its 50-second internal runtime budget cannot safely contain another provider attempt and final database write. An HTTP `202` response with `hasMore: true` and `incomplete: true` means an authorized operator or private dispatcher must wait for the `Retry-After` interval and repeat the same bearer-authenticated publish request. Continue until the endpoint returns HTTP `200` with both fields false. The ledger and Resend idempotency key make repeated calls safe. Do not change the post, recipient, sender, origin, template, postal address, or unsubscribe signing key during an incomplete retry sequence; the persisted payload fingerprint fails closed if that identity changes.

## Environment contract

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical public origin used in reader-facing links | Browser-visible |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project endpoint | Browser-visible |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public row-level-security credential | Browser-visible |
| `SUPABASE_SERVICE_ROLE_KEY` | Compatibility name for a current Supabase secret/server key or legacy service-role JWT | Server-only |
| `RESEND_API_KEY` | Delivery provider authorization | Server-only |
| `NOTIFICATION_FROM_EMAIL` | Verified sender identity | Server-only configuration |
| `NOTIFICATION_POSTAL_ADDRESS` | Truthful sender postal address rendered in each message | Server-only configuration |
| `NOTIFICATION_PUBLISH_SECRET` | Privileged publication authorization | Server-only secret |
| `NOTIFICATION_UNSUBSCRIBE_SECRET` | Unsubscribe token signing | Server-only secret |

Real values belong in the deployment provider or private overlay, never in Git. Preview and Production must use distinct secrets and, whenever possible, distinct Supabase and Resend resources.

## Privacy and operations

- Define and publish a retention/deletion policy before accepting real addresses.
- Restrict service-role access to the notification server path.
- Provide a process for address deletion and correction.
- Back up only what is required and protect backups like the live subscriber store.
- Monitor send volume, errors, bounces, complaints, and unusual publish attempts.
- Configure authenticated Resend webhook handling or an equivalent private process before Production so bounces and complaints suppress future sends.
- Test with synthetic addresses and approved recipients, not customer data.
- Treat logs, suppression lists, and provider events as private production records.

## Assumptions and legal gate

This reference establishes explicit opt-in, one-click unsubscribe, and a fail-closed postal-address footer contract, but it does not claim that one consent flow satisfies every jurisdiction or sender-policy regime. Production remains gated on a truthful `NOTIFICATION_POSTAL_ADDRESS`, verified sender/domain, suppression handling for bounces and complaints, and operator review of confirmed/double opt-in, disclosures, and retention. Those real values and provider operations belong in the private production overlay.
