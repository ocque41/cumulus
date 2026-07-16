# Security policy

## Supported version

Cumulus 0.0.8 is the supported fresh-reference release line. Older prototypes and historical deployments are not assumed to receive fixes from this branch.

## Report a vulnerability privately

Use the repository host's private security-advisory feature when available. Include the affected commit or version, impact, reproduction steps, and a minimal proof of concept. Do not include real subscriber addresses, live secrets, private dashboard links, or production payloads.

If no private channel is available, open a public issue that contains no vulnerability detail and asks the maintainers to establish a private contact path. Do not publish an exploitable report while arranging contact.

The maintainers will confirm the report, assess scope, coordinate a fix and disclosure, and credit reporters who request credit when it is safe to do so. This document does not promise a fixed response deadline.

## Security boundaries

The browser may receive only:

- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_SUPABASE_URL`;
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

These are public by design and must be constrained by Supabase row-level security. They are not substitutes for server authorization.

The following are confidential server values:

- `SUPABASE_SERVICE_ROLE_KEY`;
- `RESEND_API_KEY`;
- `GITHUB_ACCESS_TOKEN`;
- `NOTIFICATION_PUBLISH_SECRET`;
- `NOTIFICATION_UNSUBSCRIBE_SECRET`.

Never expose them through Vite, client bundles, URLs, error bodies, analytics, screenshots, or logs. `GITHUB_ACCESS_TOKEN` must belong to a separate least-privilege viewer identity with no private-repository access; do not use the profile owner's credential. `NOTIFICATION_FROM_EMAIL` and `NOTIFICATION_POSTAL_ADDRESS` are server configuration; their provider and operator records remain private.

The privileged publication action must authenticate on the server, rate-limit abuse, and enforce delivery idempotency. Unsubscribe tokens must be scoped and signed. Public Supabase access must be user-scoped through row-level policies; the service-role key bypasses those policies and must never be used in public browser routes.

## Operator responsibilities

Self-hosters are responsible for:

- least-privilege access to Vercel, Supabase, Resend, DNS, and source hosting;
- dependency and runtime updates;
- database backups and tested recovery;
- bounce, complaint, abuse, and unexpected-volume monitoring;
- credential rotation and incident response;
- applicable consent, privacy, retention, and deletion requirements;
- keeping production data and internal incident records outside the public repository.

Changing the web application does not prove the external Vercel project, domain, database, or mail account is secure.

## Release checks

Run from a clean install:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run audit:deps
npm run security:scan
npm run license:check
npm run test:e2e
```

Review findings rather than treating an exit code as complete assurance. Record skipped checks and unverified external state. Follow `docs/public-release.md` before push, migration, or production promotion.

## Assumptions

The existing production infrastructure is externally managed and unverified from this public branch. No real secrets, provider identifiers, user records, or domain configuration should be present in Git.
