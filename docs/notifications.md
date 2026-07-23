# New-post notifications

Cumulus uses an email address only to manage optional new-log notifications. It does not create profiles, social identities, or publishing accounts.

## Reader promise

Before requesting a magic link, the interface states that the address is used for new-log notifications, every broadcast includes an unsubscribe path, and reading remains public. The reader must explicitly accept this disclosure. Addresses are normalized to lowercase and never written to application logs.

On the first eligible visit, Cumulus can open the notification invitation automatically. Once either that invitation or a manually requested notification-settings surface has actually been displayed, the browser stores the versioned marker `cumulus.notificationPrompt.seen.v1` with the value `1` in local storage, with session or in-memory fallback only when local storage is unavailable. The automatic path writes the marker only after the dialog is open. A manually opened unavailable-state surface also writes it because the surface was still displayed. The marker contains no email address, consent decision, subscription status, or other identifier; it is evidence only that a notification surface was displayed, and it prevents repeated automatic prompts in that browser. Clearing site data removes it, and notification settings remain available manually regardless of the marker. The privacy page, notification callback, and unknown routes never open the invitation automatically, and an already-open automatic invitation closes when navigation reaches one of those routes.

## Resend data model

Resend is the sole notification system of record:

- a Contact holds the email address;
- a dedicated Segment limits all Cumulus operations to Cumulus readers;
- a dedicated Topic records `opt_in` or `opt_out` and must default to `opt_out`;
- Broadcasts target both the Segment and Topic;
- Resend suppression events turn the Cumulus Topic off only for Contacts in the Cumulus Segment.

The Segment and Topic IDs are private deployment configuration. Cumulus checks both resources before a publication. A missing resource or a Topic that defaults to opt-in fails closed.

## Notification access

`POST /api/notifications/sign-in` sends an at-most-30-minute, purpose-bound confirmation link through Resend. Its footer repeats the signed link as an explicit “Manage or unsubscribe from new-post emails” action, so the message always offers a password-free route back to the preference without activating it. The token is placed in the URL fragment so it is not sent in the callback request or access logs. `POST /api/notifications/session` exchanges it for a 30-day signed `HttpOnly`, `SameSite=Lax`, secure cookie. That cookie grants only notification-preference access. State-changing requests require the canonical browser origin. Forgetting the email on a browser clears the cookie but does not change consent.

`GET /api/notifications/preferences` reads the Contact's Segment and Topic state. `PUT` activates or deactivates only the Cumulus Topic. After the top-right Notification settings dialog recognizes a signed session, it shows the current state and an explicit unsubscribe action when notifications are active. Reactivation requires an authenticated, explicit reader action. Repeated actions are safe.

## Publication and unsubscribe

`POST /api/notifications/publish` requires `NOTIFICATION_PUBLISH_SECRET`. It builds a deterministic Broadcast name and idempotency key from the immutable post slug, checks for an existing exact-content Broadcast, and refuses content conflicts. Resend Broadcasts supply the recipient-specific unsubscribe URL; the HTML presents it as a clear footer button and the plain-text part includes the same action. Both HTML and text include the truthful configured postal address.

An external publisher must not call this endpoint until the reviewed commit is on `main`, Vercel reports a successful Production deployment for that exact commit, and the public `/logs/{slug}` route passes a smoke check. It must call dry-run mode first. A failed preview, merge, deployment, public-route check, or dry run blocks delivery. A later retry uses the same slug, so the endpoint's existing idempotency protection prevents a second broadcast.

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

## Operations and assumptions

Monitor volume, errors, bounces, complaints, and unusual publish attempts in the providers. Use approved synthetic recipients for lifecycle tests. A verified deletion request to `hi@cumulush.com` must remove the Cumulus Contact where operational and legal requirements allow; provider retention and suppression obligations may preserve limited records. Production readiness requires a verified sender/domain, truthful postal address, configured webhook, and controlled email-confirmation, opt-in, receipt, unsubscribe, and suppression evidence.
