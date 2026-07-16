# Cumulus rebuild implementation plan

## Objective

Build Cumulus from an empty Git root as a large, dither-led React and Vite log site while retaining the existing Vercel project and domain. Deliver a literal reference-layout branch first, then clone the proven implementation into a second branch whose visual structure is independently designed. The finished site must include at least twenty evidence-backed project posts, per-post source backlinks, public GitHub activity for `ocque41`, notification-only sign-in, and consented new-post email through Resend.

## Assumptions

1. The existing Vercel project, domain, and Git integration are externally managed. They must be inspected before cutover and must not be recreated.
2. Production provider state is not proven by repository files or by a statement in this plan.
3. `request/jacquard-reference` is the literal-layout implementation branch. `request/cumulus-original` was forked from the first complete reference implementation, not from the legacy application; later shared corrections must remain synchronized between the two branches.
4. Local project research is read-only. Only facts that are safe for a public site and corroborated by public sources may be published.
5. `ocque41` is the authorized public GitHub identity for the activity graph and public repository backlinks.
6. Sign-in exists only to confirm and manage post-notification consent. Cumulus does not add public profiles, social features, or content-authoring accounts.
7. Production secrets are injected through an authenticated provider control plane and never copied into Git, public artifacts, browser bundles, command history, screenshots, or logs.
8. Main replacement, branch push, live database migration, production secret mutation, deployment, and domain promotion are separate external actions. Perform each only within the user's current authorization and preserve an audit record that contains no secret values.

## Phase 0 — establish the safe baseline

Status: **complete and revalidated on 2026-07-16**.

1. Preserve the legacy checkout and any user-owned dirty files.
2. Prove that the fresh base branch has a parentless empty root commit.
3. Build the reference branch from that root using React and Vite; reject Next.js packages, runtime assumptions, and copied `next/image` code.
4. Inventory the external Vercel linkage without changing it. Record only public-safe facts.
5. Record supplied font checksums, upstream OFL texts, component provenance, and code-license boundaries.

Required evidence: Git branch and commit graph, clean-scope review, dependency manifest inspection, font inventory, license check, and a redacted Vercel project/domain inspection.

## Phase 1 — implement the shared product foundation

Status: **complete on the selected branch; final shared-change reconciliation with the reference branch is in progress**.

1. Define pure black surfaces, neutral gray text roles, and one minimal high-contrast orange accent.
2. Load only the supplied non-charted Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9 font files. Do not author a second typography family.
3. Implement the approved visual vocabulary: Dither Image, Edge Blur, Hero Dithering, Tripwire-style dither utilities where licensed, and faithful local derivatives.
4. Provide static and reduced-motion fallbacks for shader effects.
5. Build semantic routing for home, log index, post, auth callback, preferences, unsubscribe, and not-found states.
6. Keep shared behavior independent from the reference layout so the second visual branch can reuse product logic without copying its structure.

Required evidence: source inspection, focused unit tests, font network review, dependency/license checks, reduced-motion review, and a production build.

## Phase 2 — research projects and produce the log corpus

Status: **complete: 24 published posts with exact claim-ledger parity**.

1. Use the repository skill at [`skills/project-post-research/SKILL.md`](../skills/project-post-research/SKILL.md).
2. Inventory authorized projects under a configurable local projects root using read-only commands.
3. Map local Git remotes to public GitHub repositories owned by or explicitly associated with `ocque41`.
4. Verify time-sensitive repository facts against current GitHub primary sources.
5. Create an evidence ledger for every candidate post. Exclude private repositories, internal URLs, local paths, secrets, customer data, and claims that cannot be made public safely.
6. Publish at least twenty substantial, original posts mixed across projects. Each post must explain context, a concrete engineering or design problem, the approach, meaningful tradeoffs, and what the available evidence actually proves.
7. Give every published post a stable page, unique slug, project label, date, related-post links, and source backlinks to public primary sources.
8. Validate counts, uniqueness, related-link integrity, source-link syntax, draft exclusion, and route resolution mechanically.

Required evidence: public-safe project inventory, per-post claim/source ledger, current GitHub response metadata, content validation tests, route crawl, and manual review for unsupported claims.

## Phase 3 — finish the literal reference experience

Status: **implementation complete; final reconciliation and renewed branch-specific browser proof are in progress**.

1. Reproduce the supplied reference image's macro layout, order, spacing rhythm, large grid, and editorial density without copying third-party text or branded media.
2. Make the home page intentionally large and lead with oversized `CUMULUS`, a very small `lab`, and the `ocque41` GitHub contribution/activity graph.
3. Make the post index and each article page expansive. Use varied approved dither fields, plates, transitions, and edge treatments without reducing readability.
4. Build a distinctive, high-impact dither footer that remains a real semantic footer with usable links and notification controls.
5. Preserve navigation, focus behavior, responsive hierarchy, and performance at mobile, tablet, desktop, and wide-desktop widths.

Required evidence: the complete [design checklist](design-verification-checklist.md), reference comparison screenshots, interaction walkthroughs, browser console review, accessibility checks, and performance sampling.

## Phase 4 — complete notification-only identity and email

Status: **code and database behavior are complete; live delivery remains gated**.

1. Implement Supabase magic-link or OTP sign-in with the existing public callback path.
2. Capture explicit new-post consent and store a versioned consent record protected by user-scoped RLS.
3. Keep the service-role key, Resend key, publish secret, and unsubscribe signing secret on the server.
4. Implement signed one-click unsubscribe, immediate suppression, normalized unique addresses, publication-event idempotency, retry leases, bounded attempts, and terminal failure records.
5. Render accessible notification email with an absolute post URL and unsubscribe URL.
6. Verify preview sending only to an allowlisted test recipient before any production send.
7. Follow the [notification and Vercel gates](notification-vercel-safety-gates.md) for provider configuration and cutover.

Required evidence: database migration review, RLS tests, API tests, auth callback tests, retry/idempotency tests, sanitized preview delivery proof, unsubscribe walkthrough, and absence-of-secrets scans for source and browser output.

## Phase 5 — create the independently structured branch

Status: **complete on `request/cumulus-original`; current release hash is recorded after final verification**.

1. Create the second design branch from the first complete reference implementation so both variants begin with the same content, product behavior, security rules, and tests; reconcile later shared corrections explicitly.
2. Change visual structure only. Preserve routes, data contracts, accessibility, notification semantics, public sources, and release gates.
3. Produce an original information hierarchy and page composition while staying inside the same palette, supplied fonts, and approved dither component vocabulary.
4. Run the entire design, content, behavior, and release verification suite on the second branch independently.

Required evidence: branch graph, scope diff showing visual-only structural changes, complete test results, and a second set of responsive screenshots.

## Phase 6 — completion audit and release decision

Status: **in progress; only the production notification lifecycle remains open**.

1. Re-run all repository checks from a clean install.
2. Walk every public route and every notification state at desktop and mobile widths.
3. Revalidate GitHub links and any live repository facts.
4. Review the built browser assets and repository history for secrets, private paths, private URLs, customer data, and unexpected font or component assets.
5. Fill every applicable row in the [completion matrix](requirement-evidence-matrix.md) with direct, current evidence.
6. Keep preview readiness distinct from production readiness. Do not mark production complete until provider state, live migration, delivery, deployment, and domain behavior are all verified in the approved production environment.

## Exit condition

Completion requires every applicable matrix row to be `Proven`, no unresolved severity-one or severity-two defect, no skipped required check, and no unverified external state. Only then may the final handoff end with the exact sentence:

> Everything requested works. Stop.
