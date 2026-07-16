# Vercel preview and cutover

This runbook preserves the existing Vercel project and domain association while releasing Cumulus 0.0.8. The initial cutover has occurred; use the same gates for later releases. It does not create a new project and it does not treat Git as proof of provider state.

## Known state and assumptions

- An authenticated provider inspection verified the existing Vercel project and its `cumulush.com` production domain association.
- `main` is the production branch and `request/cumulus-original` is the selected design source. Verify the exact commit-to-deployment linkage again for every candidate.
- No Vercel project ID, team ID, domain, dashboard link, or domain configuration is stored in Git.
- The literal layout study remains `request/jacquard-reference`; it is not the selected production composition.
- The prior application history is retained on `archive/pre-redesign-20260716` as the Git rollback record. Vercel deployment rollback remains an external provider operation.
- Pushing a candidate, changing project-wide settings, applying a migration, updating `main`, and promoting production remain separate gates.

If any assumption is wrong, stop and update this runbook before changing external state.

## Gate 0: local candidate

Build and verify the exact candidate without publishing it:

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run audit:deps
npm run security:scan
npm run license:check
```

Record the commit and check results. A local `dist/` directory proves the Vite build only; it says nothing about Vercel, the domain, Supabase, or Resend.

## Gate 1: inspect the existing project

An authorized Vercel operator must inspect the provider UI and privately record:

1. project and team identity;
2. connected Git repository and production branch;
3. current production deployment and rollback candidate;
4. attached domains and which deployment they resolve to;
5. framework, install, build, output, and function settings;
6. Preview and Production environment-variable presence and scoping;
7. deployment-protection and branch-preview rules.

Do not paste private identifiers or dashboard links into this public repository or a public issue.

If project-wide settings still assume the old application and are incompatible with Vite, capture the old values and request approval before changing them. A project-wide setting can affect production even when the immediate goal is a preview.

## Gate 2: configure a candidate safely

In the existing project's Preview environment, configure candidate values. Production uses the same contract with independently scoped production values:

- `NEXT_PUBLIC_SITE_URL` for the preview's public origin;
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for a non-production Supabase project;
- `SUPABASE_SERVICE_ROLE_KEY` for that same non-production project;
- `RESEND_API_KEY` for test delivery;
- `NOTIFICATION_FROM_EMAIL` for a provider-approved test sender;
- `NOTIFICATION_POSTAL_ADDRESS` for the valid sender postal address rendered in every notification;
- optional `GITHUB_ACCESS_TOKEN` for the server-side `ocque41` GraphQL request; omit it to use the bounded public-profile calendar;
- independent preview values for `NOTIFICATION_PUBLISH_SECRET` and `NOTIFICATION_UNSUBSCRIBE_SECRET`.

The `NEXT_PUBLIC_*` variables are injected into the browser bundle by Vite and are visible to users. All other values must remain server-only. Do not copy production reader data into preview.

The server requires the `cumulush.com` site origin and sender domain only when Vercel reports the Production environment. Preview may use its actual HTTPS preview origin and a provider-approved test sender. Verify both branches independently; do not configure Preview with a production origin merely to bypass a rejected value.

## Gate 3: publish a candidate deployment

Only after explicit push approval, publish the candidate branch to the already connected Git repository. Confirm that Vercel creates a Preview deployment inside the existing project. For the current selected composition, that branch is `request/cumulus-original`.

Do not:

- create a similarly named replacement Vercel project;
- change the production branch to the reference branch merely to obtain a preview;
- attach or move the production domain;
- run a production Supabase migration;
- place provider identifiers in Git.

If no preview appears, diagnose the existing Git integration and branch rules with an authorized operator. Do not reconnect or replace the project on assumption.

## Gate 4: prove the preview

Verify the exact preview deployment:

- the Vite application loads directly and after a route refresh;
- fonts are served locally and only the non-charted variants are present;
- mobile and desktop layouts follow `BRAND_GUIDELINES.md`;
- subscription consent and validation are accessible;
- repeat subscribe and repeat unsubscribe are safe;
- the privileged publish action rejects missing and invalid secrets;
- an approved synthetic recipient receives at most one message for one publication event;
- the unsubscribe link targets the preview and suppresses later delivery;
- logs and error responses do not expose secrets or full subscriber data.

Then run:

```bash
npm run test:e2e
```

Record the preview deployment identifier privately and the test outcome publicly only when it contains no sensitive URL or data.

## Gate 5: live database migration

The Cumulus 0.0.8 notification migrations are applied in the current production project. Future migrations still use this independent gate; a successful prior application does not authorize another.

The production Supabase migration is independent from the web deployment. Before applying it:

1. review that it is additive and does not alter unrelated objects;
2. test it on an empty and representative non-production database;
3. create a provider-supported backup;
4. prepare a forward-fix or rollback plan;
5. obtain explicit live-migration approval;
6. apply it with authenticated operator tooling;
7. verify schema, policies, indexes, and synthetic subscription behavior.

Do not claim this gate complete because migration SQL exists in Git.

## Gate 6: main and production cutover

The initial design cutover to `main` was explicitly authorized. Each later `main` update and production promotion still requires a verified candidate and current authorization.

After preview and migration evidence is accepted, obtain explicit approval for the chosen `main` transition. The approved operation may be a reviewed merge or a controlled replacement, but it must preserve an auditable pre-cutover commit and must not be inferred from preview approval.

Before promotion:

- configure the same environment contract in Production with real values supplied privately;
- confirm the existing project's production branch and build settings;
- confirm the existing domain is still attached to that project;
- retain the prior known-good deployment as the rollback target;
- agree on a short post-deployment validation window.

Only then promote or deploy the approved commit. Because the domain remains attached to the same external project, no domain recreation should be necessary. Verify that statement in Vercel before and after cutover; Git cannot prove it.

## Post-cutover and rollback

Check the homepage, direct routes, font assets, notification opt-in, one controlled delivery, unsubscribe, server error rate, and unexpected send volume. Do not use an arbitrary real reader for smoke testing.

If the browser application fails, restore the retained Vercel deployment while preserving evidence. If the additive database change causes a problem, prefer a reviewed forward fix unless the prepared database rollback is proven safe. Rotating or removing notification secrets is an incident action and should not be improvised as a normal web rollback.

Document what actually happened: candidate commit, approvals, provider verification, migration result, production deployment, checks, and any remaining uncertainty. For the current release, notification publication remains intentionally unavailable until the truthful postal address and Resend webhook signing secret are configured and a controlled lifecycle proves sign-in, receipt, unsubscribe, and later suppression.
