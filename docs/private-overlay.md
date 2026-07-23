# Public repository and private overlay

This repository contains public UI, tests, API contracts, placeholder configuration, and self-hosting documentation. It must not contain real credentials, provider identifiers, subscriber data, delivery payloads, private URLs, or operational evidence.

Keep the following directly in Vercel, Resend, an approved secret manager, or a private operational repository:

- Resend API and webhook secrets, Segment/Topic IDs, Contacts, Broadcast records, suppression events, and verified sender state;
- Vercel project/team identifiers, deployment URLs, tokens, environment values, domain evidence, and rollback records;
- truthful postal address and independent publication/session signing secrets;
- real recipient addresses, support requests, and lifecycle evidence.
- private publisher source and deployment access, Sites D1 drafts and workflow state, owner allowlists, repository-scoped GitHub write credentials, Vercel monitoring credentials, and publisher audit evidence.

The remote publisher may dispatch only the checked-in GitHub Actions publication workflows. Repository workflows may write only the public-safe `src/content/posts.json` file through a reviewed pull request. Sites must not create Git refs, content commits, pull requests, or merges directly. Its runtime secrets must remain in the private Sites environment. The public repository may contain the content schema, strict payload validator, remote CI, and documentation, but not the publisher's credentials, private deployment URL, drafts, D1 events, owner identity, or provider identifiers.

Use a repository-scoped GitHub App for long-lived Sites authentication. Keep its App ID, installation ID, and private key in Sites secrets. Do not store a user personal access token in the public project or private publisher after the controlled GitHub App cutover. GitHub workflow `GITHUB_TOKEN` permissions are declared explicitly in each workflow and expire with the run.

`NEXT_PUBLIC_SITE_URL` is deliberately browser-visible. Every notification credential is server-only. Synthetic examples such as `reader@example.com` are safe; sanitized-looking copies of live data are not. Outlook is outside the Cumulus system and remains untouched.
