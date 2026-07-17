# New-post notifications

Cumulus uses email identity only to manage optional new-log notifications. It does not create profiles, social identities, or publishing accounts.

## Reader promise

Before requesting a magic link, the interface states that the address is used for new-log notifications, every broadcast includes an unsubscribe path, and reading remains public. The reader must explicitly accept this disclosure. Addresses are normalized to lowercase and never written to application logs.

## Resend data model

Resend is the sole notification system of record:

- a Contact holds the email address;
- a dedicated Segment limits all Cumulus operations to Cumulus readers;
- a dedicated Topic records `opt_in` or `opt_out` and must default to `opt_out`;
- Broadcasts target both the Segment and Topic;
- Resend suppression events turn the Cumulus Topic off only for Contacts in the Cumulus Segment.

The Segment and Topic IDs are private deployment configuration. Cumulus checks both resources before a publication. A missing resource or a Topic that defaults to opt-in fails closed.

## Notification access

`POST /api/notifications/sign-in` sends a 30-minute, purpose-bound signed link through Resend. The token is placed in the URL fragment so it is not sent in the callback request or access logs. `POST /api/notifications/session` exchanges it for a 30-day signed `HttpOnly`, `SameSite=Lax`, secure cookie. That cookie grants only notification-preference access. State-changing requests require the canonical browser origin. Signing out clears the cookie but does not change consent.

`GET /api/notifications/preferences` reads the Contact's Segment and Topic state. `PUT` activates or deactivates only the Cumulus Topic. Reactivation requires an authenticated, explicit reader action. Repeated actions are safe.

## Publication and unsubscribe

`POST /api/notifications/publish` requires `NOTIFICATION_PUBLISH_SECRET`. It builds a deterministic Broadcast name and idempotency key from the immutable post slug, checks for an existing exact-content Broadcast, and refuses content conflicts. Resend Broadcasts supply the standards-based unsubscribe URL. Both HTML and text include the truthful configured postal address.

The Git-linked Vercel integration emits `vercel.deployment.success` repository-dispatch events. `.github/workflows/publish-new-post-notifications.yml` accepts only Production events, rejects notification-field rewrites relative to the deployed revision's first parent, and reconciles every published slug outside `src/content/notification-legacy-slugs.json`. The baseline contains only posts that predate automation. This avoids losing notifications when several commits are pushed together or an intermediate deployment is skipped. The endpoint's deterministic Broadcast identity makes repeated reconciliation idempotent. The workflow retries a dry run while the canonical route propagates, then performs the real publication. Preview deployments never send. GitHub Actions must hold the same `NOTIFICATION_PUBLISH_SECRET` value as Vercel; missing or mismatched configuration fails closed. Manual workflow runs default to dry-run-only.

The workflow file must already exist on GitHub's default branch before repository-dispatch events can run it. Consequently, a branch Preview proves the workflow source and post route but cannot activate delivery. Merge, Production deployment, GitHub secret configuration, Resend state, and receipt remain separate gates.

The authenticated Resend webhook accepts only bounced, complained, and suppressed events. It verifies the Svix signature over the raw body, normalizes unique recipients, and opts the matching Cumulus Topic out. Unsupported events are acknowledged and ignored; provider failures return a retryable error.

## Environment contract

| Variable | Purpose | Exposure |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin | Browser-visible |
| `RESEND_API_KEY` | Contacts, Topics, Broadcasts, and email API | Server-only secret |
| `RESEND_WEBHOOK_SECRET` | Resend webhook verification | Server-only secret |
| `RESEND_NOTIFICATION_SEGMENT_ID` | Dedicated reader Segment | Server-only configuration |
| `RESEND_NOTIFICATION_TOPIC_ID` | Dedicated new-log Topic | Server-only configuration |
| `NOTIFICATION_FROM_EMAIL` | Verified sender | Server-only configuration |
| `NOTIFICATION_POSTAL_ADDRESS` | Truthful broadcast footer address | Server-only configuration |
| `NOTIFICATION_PUBLISH_SECRET` | Publication authorization | Server-only secret |
| `NOTIFICATION_UNSUBSCRIBE_SECRET` | Compatibility name for notification link/session signing | Server-only secret |

Real values belong in Resend and Vercel, never in Git. Preview and Production use independently scoped signing and publication secrets. Outlook is not part of this architecture and must not be changed to operate Cumulus.

The Production publication secret is also stored as a masked GitHub Actions secret named `NOTIFICATION_PUBLISH_SECRET`. Do not place it in workflow YAML, repository variables, command output, or a pull-request environment. Rotate the Vercel and GitHub copies together.

## Operations and assumptions

Monitor volume, errors, bounces, complaints, and unusual publish attempts in the providers. Use approved synthetic recipients for lifecycle tests. A verified deletion request to `hi@cumulush.com` must remove the Cumulus Contact where operational and legal requirements allow; provider retention and suppression obligations may preserve limited records. Production readiness requires a verified sender/domain, truthful postal address, configured webhook, and controlled sign-in, opt-in, receipt, unsubscribe, and suppression evidence.
