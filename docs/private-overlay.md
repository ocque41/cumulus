# Public repository and private overlay

This repository contains public UI, tests, API contracts, placeholder configuration, and self-hosting documentation. It must not contain real credentials, provider identifiers, subscriber data, delivery payloads, private URLs, or operational evidence.

Keep the following directly in Vercel, Resend, an approved secret manager, or a private operational repository:

- Resend API and webhook secrets, Segment/Topic IDs, Contacts, Broadcast records, suppression events, and verified sender state;
- Vercel project/team identifiers, deployment URLs, tokens, environment values, domain evidence, and rollback records;
- the licensed Alcyone WOFF2 bytes, its source archive and license evidence, and the Production-only `ALCYONE_MEDIUM_WOFF2_BASE64` value;
- truthful postal address and independent publication/session signing secrets;
- real recipient addresses, support requests, and lifecycle evidence.

`NEXT_PUBLIC_SITE_URL` is deliberately browser-visible. Every notification credential is server-only. `ALCYONE_MEDIUM_WOFF2_BASE64` is also server-configured but is a licensing boundary, not a secret, because the font is delivered to the browser through a same-origin route. Keep it unset in Local and Preview and scope it only to the single licensed Production website. Synthetic examples such as `reader@example.com` are safe; sanitized-looking copies of live data are not. Outlook is outside the Cumulus system and remains untouched.
