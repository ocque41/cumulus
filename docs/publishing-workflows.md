# Repository-native publication workflows

The private Cumulus publisher stores drafts and orchestration history. It does not mutate Git branches, repository content, pull requests, or merges directly. Those operations belong to three checked-in GitHub Actions workflows.

## Prepare

`prepare-publication.yml` accepts one base64-encoded version 1 payload through `workflow_dispatch`. The encoded input must be no larger than 65,535 characters. `scripts/publisher-contract.mjs` rejects malformed base64, unknown fields, unsupported schema versions, invalid hashes and identifiers, duplicate slugs, future dates, unsafe links, unknown categories, unsupported visual variants, malformed sections, and content-digest mismatches.

The payload contains only an opaque draft identifier, opaque correlation identifier, attempt number, source hash, content digest, and the public article record. It must not contain credentials, owner identity, subscriber data, private URLs, provider response bodies, or arbitrary file paths.

After validation, the workflow:

1. Reads the current `main` SHA.
2. Creates or reuses the deterministic `content/{slug}-{draft-hash}-a{attempt}` branch.
3. Changes only `src/content/posts.json`.
4. Creates or reuses one open pull request.
5. Records only safe identifiers in a short-lived result artifact.
6. Dispatches validation for the exact head SHA.

Repeated dispatches reuse the same branch and pull request. Identical validated content is a no-op. The same slug with different content fails.

## Validate

`validate-publication.yml` checks out the exact requested head SHA and creates the `publisher-verify` check. It installs locked dependencies and runs lint, type checking, unit tests, the production build, security scanning, license validation, dependency audit, and desktop/mobile browser tests.

A failed validation leaves the pull request open for inspection. The article payload and provider credentials are never written to logs.

## Merge

`merge-publication.yml` accepts the exact base SHA, branch, head SHA, pull-request number, slug, and opaque correlation identifier. Immediately before merging, it confirms:

- the pull request is still open against `main`;
- base, branch, and head identifiers are unchanged;
- current `main` still equals the reviewed base SHA;
- the pull request changes only `src/content/posts.json`;
- `publisher-verify` succeeded for the exact head SHA;
- a Vercel commit status succeeded for the exact head SHA.

If `main` changed, the workflow returns `STALE_PUBLICATION` and does not force-update the branch. The private publisher must prepare a new attempt. If all boundaries pass, the workflow squash-merges the exact reviewed head.

## Authentication and private state

Sites should authenticate to the workflow-dispatch and workflow-monitoring APIs through a GitHub App installed only on this repository with Actions read/write and Metadata read. Repository mutations occur inside workflows under their declared, short-lived `GITHUB_TOKEN` permissions. GitHub App credentials, Vercel monitoring credentials, D1 drafts, events, request IDs, deployment IDs, and rollback evidence remain in the private overlay.

The private publisher matches Vercel preview and production deployments by full Git commit SHA. It verifies the article route, exact title, canonical URL, archive, area page, sitemap, and `deployment-manifest.json`.

## Notification boundary

These workflows do not contact the public notification endpoint. The private publisher must display `Post publishing: enabled · Subscriber email: disabled`. A successful article stops at `deployed`. Email activation is a separate release that must retain the existing consent, unsubscribe, suppression, postal-address, webhook, and idempotency safeguards.
