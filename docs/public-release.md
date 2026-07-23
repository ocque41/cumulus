# Public release checklist

Use this checklist for Cumulus 0.0.8 before pushing either design branch, publishing a tag, or promoting a production deployment. A local pass proves only the checked local artifact; it does not prove Vercel linkage, domain state, migration state, or live delivery. The selected design is `request/cumulus-original`; `request/jacquard-reference` remains the literal layout study.

## 1. Scope and provenance

- [ ] The release is based on the selected `request/cumulus-original` branch, and shared behavior has been reconciled with `request/jacquard-reference`.
- [ ] `package.json`, lockfile metadata, visible version text, and any changelog or release notes included in the candidate agree on `0.0.8`.
- [ ] The tag, if approved, is `0.0.8` rather than `v0.0.8`.
- [ ] The diff contains no unrelated history, generated local state, or private overlay material.
- [ ] Root code and documentation are Apache-2.0 and no AGPL source is present.

## 2. Secrets and privacy

- [ ] `.env.example` contains placeholders only.
- [ ] No `.env.local`, token, cookie, key, database dump, subscriber address, delivery payload, private URL, real project ID, or dashboard screenshot is tracked.
- [ ] Browser bundles contain only approved `NEXT_PUBLIC_*` values.
- [ ] `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, Resend Segment/Topic IDs, optional `GITHUB_ACCESS_TOKEN`, `NOTIFICATION_POSTAL_ADDRESS`, `NOTIFICATION_PUBLISH_SECRET`, and `NOTIFICATION_UNSUBSCRIBE_SECRET` remain outside public files and browser bundles.
- [ ] If configured, `GITHUB_ACCESS_TOKEN` belongs to a separate least-privilege viewer identity with no private-repository access; otherwise the endpoint uses only the fixed public profile. In both cases, the endpoint matches the public profile.
- [ ] Test fixtures use synthetic identities.
- [ ] No private publisher source, draft, owner email, Sites URL, or publisher provider credential is tracked.

## 3. Brand and third-party material

- [ ] Only Jacquard 12, Jacquard 24, Jacquarda Bastarda 9, and the four supplied GFS Neohellenic styles are bundled in Git and browser assets.
- [ ] No charted font archive, file, preload, or generated derivative is present.
- [ ] `NOTICE` includes the upstream font copyrights and full SIL OFL 1.1 text.
- [ ] No unapproved component library or unlicensed copied component source is present.
- [ ] Dither/blur behavior follows `BRAND_GUIDELINES.md` and remains usable with reduced motion.

## 4. Deterministic checks

From a clean install:

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

- [ ] Every command passed against the candidate commit.
- [ ] Any skipped or environment-dependent test is named in the handoff and is not reported as passed.
- [ ] Responsive behavior was checked at 320 px, 390 px, tablet, desktop, and wide desktop widths.
- [ ] Keyboard, visible focus, screen-reader status, and reduced-motion paths were checked.
- [ ] The JSON post catalog accepts variable post totals, short Editorial posts, and valid approved dither variants while rejecting duplicate slugs and unsafe source links.
- [ ] Routes, archive search, homepage sections, metadata, canonical URLs, sitemap, table of contents, and related-post fallback include a synthetic new post.
- [ ] The homepage renders exactly one latest log and at most four previous logs, independent of catalog size.
- [ ] Archive and area pages paginate at ten logs, use crawlable anchors, and reject invalid or out-of-range pages.
- [ ] Search and filter combinations are `noindex` and canonicalize to their unfiltered collection path.
- [ ] `deployment-manifest.json` matches the candidate Git SHA, content digest, post count, newest slug, and generated route count.
- [ ] Publication payload tests reject oversized, malformed, future-dated, unsafe-link, duplicate-slug, unsupported-field, and cross-file mutation attempts.

## 5. Notification behavior

- [ ] `/privacy` accurately describes current data handling, retention limits, and the verified correction/deletion contact.
- [ ] Consent wording says the address is used for new-post notifications.
- [ ] Repeated subscription requests do not create duplicate Contacts or duplicate opt-in state.
- [ ] Every delivered message has a working unsubscribe path.
- [ ] Every HTML and text message includes the truthful configured postal address.
- [ ] Repeated unsubscribe is safe and an unsubscribed address is excluded from sends and retries.
- [ ] A stable publication-event idempotency key prevents duplicate delivery.
- [ ] The privileged publish action rejects missing or invalid authorization.
- [ ] The authenticated Resend webhook verifies raw-body signatures and handles bounced, complained, and suppressed events in Production.
- [ ] Duplicate webhook delivery is safe and suppression changes only the Cumulus Topic for Contacts in its Segment.

## 6. Vercel preview and cutover gates

- [ ] The authorized operator verified the existing Vercel project and Git integration in the provider UI.
- [ ] The existing domain association was recorded privately; no domain config was added to Git.
- [ ] Push approval was given before publishing the selected candidate branch.
- [ ] The branch created a preview on the existing project, not a replacement project.
- [ ] Preview environment variables and server-only scoping were verified.
- [ ] The preview passed smoke and end-to-end checks with synthetic data.
- [ ] Main replacement or merge has separate explicit approval.
- [ ] Production promotion and live domain cutover have separate explicit approval.
- [ ] The prior production deployment remains available for rollback until post-cutover checks pass.
- [ ] If the private remote publisher is used, its reviewed commit matches the successful preview commit and `main` has not changed since preview creation.
- [ ] The matching Production deployment and `/logs/{slug}` were verified before a notification dry run.
- [ ] Live publisher notifications remain disabled until a synthetic preview and controlled subscriber lifecycle pass.
- [ ] The publisher and all publication workflows make no request to `/api/notifications/publish`; a successful publication ends in `deployed`.
- [ ] `publisher-verify` and the Vercel preview status belong to the exact pull-request head SHA before merge dispatch.

## 7. Public handoff

Record the candidate commit, exact checks, preview evidence, skipped checks, migration status, external-linkage verification status, approvals, and rollback target. Clearly distinguish local readiness from preview readiness and production completion.

## Assumptions

The Vercel project, Git integration, Resend resources, and domain are external and cannot be verified from Git alone. Every later main update, push, or production promotion remains an independent gate. Outlook is outside the system and remains untouched. Production email completion still requires a truthful postal address and controlled magic-link, receipt, unsubscribe, and suppression evidence.
