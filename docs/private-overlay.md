# Public repository and private overlay

This repository contains public UI, tests, API contracts, placeholder configuration, and self-hosting documentation. It must not contain real credentials, provider identifiers, subscriber data, delivery payloads, private URLs, or operational evidence.

Keep the following directly in Vercel, Resend, an approved secret manager, or a private operational repository:

- Resend API and webhook secrets, Segment/Topic IDs, Contacts, Broadcast records, suppression events, and verified sender state;
- Vercel project/team identifiers, deployment URLs, tokens, environment values, domain evidence, and rollback records;
- truthful postal address and independent publication/session signing secrets;
- real recipient addresses, support requests, and lifecycle evidence.

`NEXT_PUBLIC_SITE_URL` is deliberately browser-visible. Every notification credential is server-only. Synthetic examples such as `reader@example.com` are safe; sanitized-looking copies of live data are not. Outlook is outside the Cumulus system and remains untouched.
