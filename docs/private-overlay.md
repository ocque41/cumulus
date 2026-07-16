# Public repository and private production overlay

Cumulus is designed so the complete reusable application can remain public while live operations stay private. The private overlay is not a hidden second application: it is the minimum set of production values, accounts, records, and operator procedures that cannot safely be published.

## Public material

Keep these in this Apache-2.0 repository:

- React/Vite UI and locally authored components;
- tests, checks, and build configuration;
- public API contracts and placeholder examples;
- additive Supabase migration source;
- self-hosting, notification, licensing, and release documentation;
- the approved non-charted fonts with their SIL OFL 1.1 notice;
- `.env.example` with non-working placeholders.

## Private production material

Keep these in Vercel, Supabase, Resend, an approved secret manager, or a private operational repository:

- real environment-variable values;
- Vercel project IDs, team IDs, deployment tokens, dashboard links, and domain-control records;
- Supabase project references, service-role keys, access tokens, database backups, and live subscriber data;
- Resend API keys, verified sender/domain records, suppression lists, delivery events, and provider-account details;
- real `RESEND_WEBHOOK_SECRET`, `NOTIFICATION_PUBLISH_SECRET`, and `NOTIFICATION_UNSUBSCRIBE_SECRET` values;
- the truthful `NOTIFICATION_POSTAL_ADDRESS` rendered in outgoing messages;
- customer or reader support records, deletion requests, incident notes, and audit evidence containing personal data;
- internal publisher tools, release approvals, recovery runbooks, and named operator access;
- production legal provider lists and agreements.

Do not commit a sanitized-looking copy of live data. Use synthetic addresses such as `reader@example.com` and placeholder hosts such as `https://your-project.supabase.co` in public examples.

## Environment placement

| Variable | Exposure | Recommended location |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Browser-visible | Vercel environment or local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser-visible | Vercel environment or local `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser-visible | Vercel environment or local `.env.local` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only current secret/server key or legacy service-role JWT | Vercel encrypted environment |
| `RESEND_API_KEY` | Server-only | Vercel encrypted environment |
| `RESEND_WEBHOOK_SECRET` | Server-only provider signing secret | Vercel encrypted environment |
| `GITHUB_ACCESS_TOKEN` | Optional server-only, separate least-privilege public-profile viewer | Vercel encrypted environment |
| `NOTIFICATION_FROM_EMAIL` | Server-only configuration | Vercel encrypted environment |
| `NOTIFICATION_POSTAL_ADDRESS` | Server-only configuration rendered in email | Vercel encrypted environment |
| `NOTIFICATION_PUBLISH_SECRET` | Server-only privileged secret | Vercel encrypted environment or approved secret manager |
| `NOTIFICATION_UNSUBSCRIBE_SECRET` | Server-only signing secret | Vercel encrypted environment or approved secret manager |

The `NEXT_PUBLIC_*` compatibility prefix is intentionally exposed by Vite. Do not put a secret behind that prefix. Conversely, never mirror a server-only value into a public alias to work around a client/server boundary.

If configured, the GitHub token must belong to a separate least-privilege viewer identity and must not inherit owner-wide or private-repository access. Without one, the fixed-user endpoint reads and strictly validates the public contribution calendar. Compare the returned calendar with the public profile before release.

Deployment credentials are not runtime configuration. Keep them out of `.env.example`, Vercel app variables, browser code, CI logs, and repository secrets unless a narrowly scoped CI workflow explicitly requires them.

## Changes that need coordination

A public interface change and its private production wiring should land as two auditable steps:

1. publish the provider-neutral contract, placeholder configuration, tests, and safe migration source here;
2. after approval, an authorized operator supplies real values and executes provider changes in the private environment.

Never report step 1 as proof that step 2 happened. An authenticated provider inspection for this rebuild verified that the existing `cloud` project retains `cumulush.com`; Git integration, deployment promotion, and live behavior remain separate evidence gates. Git intentionally contains no provider IDs, credentials, or domain-control records.

## Assumptions

The existing production project and domain are externally managed and must be retained. Their current association was inspected for this rebuild, but that snapshot is not a substitute for cutover-time verification. The public repository remains forkable without access to the original operator's accounts, readers, sender identities, or internal operations.
