# Cumulus rebuild implementation plan

> Current amendment — 2026-07-17: the local frontend/content candidate replaces the earlier 24-post public-source corpus with exactly twenty maintainer-authored first-party journals across Requisia, Insuja, Hyoka Hanesu, and gy. It adds Alcyone Medium for narrative body copy through a Production-only licensed-font boundary, keeps the Jacquard heading/interface families, replaces large cloud artwork with dither fields, and adds first-eligible-visit notification prompting. Earlier branch and production records below are historical evidence; they do not prove this uncommitted candidate or authorize deployment.

## Objective

Build Cumulus from an empty Git root as a large, dither-led React and Vite log site while retaining the existing Vercel project and domain. Deliver a literal reference-layout branch first, then clone the proven implementation into a second branch whose visual structure is independently designed. The current selected candidate includes exactly twenty evidence-bounded project journals, public GitHub activity for `ocque41`, notification-only sign-in, and consented new-post email through Resend. Source backlinks are required only for public-source reviews; the current private first-party corpus deliberately has none.

## Assumptions

1. The existing Vercel project, domain, and Git integration are externally managed. They must be inspected before cutover and must not be recreated.
2. Production provider state is not proven by repository files or by a statement in this plan.
3. `request/jacquard-reference` is the literal-layout implementation branch. `request/cumulus-original` was forked from the first complete reference implementation, not from the legacy application; later shared corrections must remain synchronized between the two branches.
4. Local project research is read-only. Public-source reviews require anonymously reachable primary sources; maintainer-authored first-party journals may use private evidence only at the approved product-narrative boundary and must label their limits explicitly.
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

Status: **complete on both design branches**.

1. Define pure black surfaces, neutral gray text roles, and one minimal high-contrast orange accent.
2. Bundle only the supplied non-charted Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9 files. Preserve them for headings, interface, and labels. Deliver the separately supplied Alcyone Medium only from the licensed Production environment and scope it to narrative body copy; never add its bytes or license archive to public Git or Preview.
3. Implement the approved visual vocabulary: Dither Image, Edge Blur, Hero Dithering, Tripwire-style dither utilities where licensed, and faithful local derivatives.
4. Provide static and reduced-motion fallbacks for shader effects.
5. Build semantic routing for home, log index, post, auth callback, preferences, unsubscribe, and not-found states.
6. Keep shared behavior independent from the reference layout so the second visual branch can reuse product logic without copying its structure.

Required evidence: source inspection, focused unit tests, font network review, dependency/license checks, reduced-motion review, and a production build.

## Phase 2 — research projects and produce the log corpus

Status: **implemented locally: exactly 20 focused journals with claim-ledger parity; candidate release verification remains open**.

1. Use the repository skill at [`skills/project-post-research/SKILL.md`](../skills/project-post-research/SKILL.md).
2. Inventory authorized projects under a configurable local projects root using read-only commands.
3. Classify each entry as a public-source review or a maintainer-authored first-party journal before drafting; do not imply that private implementation evidence is anonymously reproducible.
4. Keep the current corpus at exactly 8 Requisia, 7 Insuja, 3 Hyoka Hanesu, and 2 gy journals. Treat their dates as editorial candidate ordering until live route evidence exists.
5. Create a public-safe evidence ledger for every candidate post. Exclude repository locations, internal URLs, local paths, secrets, customer data, operational identifiers, and claims outside the approved narrative boundary.
6. Publish substantial, original, topic-specific prose. Each post must explain context, a concrete engineering or design problem, the approach, meaningful tradeoffs, and what the available evidence does and does not prove.
7. Give every published post a stable page, unique slug, project label, editorial date, dither illustration, and resolved related-post links. Do not invent or expose source backlinks for private first-party material.
8. Validate exact counts, word depth, structural variation, uniqueness, related-link integrity, draft exclusion, safety boundaries, and route resolution mechanically.

Required evidence: public-safe project inventory, per-post claim/source ledger, current GitHub response metadata, content validation tests, route crawl, and manual review for unsupported claims.

## Phase 3 — finish the literal reference experience

Status: **complete on `request/jacquard-reference`; renewed local desktop/mobile browser proof passes**.

1. Reproduce the supplied reference image's macro layout, order, spacing rhythm, large grid, and editorial density without copying third-party text or branded media.
2. Make the home page intentionally large and lead with oversized `CUMULUS`, a very small `lab`, and the `ocque41` GitHub contribution/activity graph.
3. Make the post index and each article page expansive. Use varied approved dither fields, plates, transitions, and edge treatments without reducing readability.
4. Build a distinctive, high-impact dither footer that remains a real semantic footer with usable links and notification controls.
5. Preserve navigation, focus behavior, responsive hierarchy, and performance at mobile, tablet, desktop, and wide-desktop widths.

Required evidence: the complete [design checklist](design-verification-checklist.md), reference comparison screenshots, interaction walkthroughs, browser console review, accessibility checks, and performance sampling.

## Phase 4 — complete notification-only identity and email

Status: **Resend-only code is implemented; controlled live delivery remains gated**.

1. Send purpose-bound notification magic links through Resend and exchange them for signed HttpOnly sessions.
2. Capture explicit new-post consent in a dedicated Resend Segment and opt-out-by-default Topic.
3. Keep Resend credentials/resource IDs, publish secret, and notification-session signing secret on the server.
4. Use deterministic Broadcast identity, exact content comparison, provider idempotency, unsubscribe URLs, and signed suppression webhooks.
5. Render accessible notification email with absolute links and a truthful postal footer.
6. Verify Preview with approved synthetic recipients before any production send.
7. Follow the [notification and Vercel gates](notification-vercel-safety-gates.md) for provider configuration and cutover; leave Outlook untouched.

Required evidence: API tests, auth callback tests, provider idempotency/resource tests, sanitized Preview delivery proof, unsubscribe walkthrough, signed suppression proof, and absence-of-secrets scans for source and browser output.

## Phase 5 — create the independently structured branch

Status: **complete on `request/cumulus-original`; current release hash is recorded after final verification**.

1. Create the second design branch from the first complete reference implementation so both variants begin with the same content, product behavior, security rules, and tests; reconcile later shared corrections explicitly.
2. Change visual structure only. Preserve routes, data contracts, accessibility, notification semantics, public sources, and release gates.
3. Produce an original information hierarchy and page composition while staying inside the same palette, supplied fonts, and approved dither component vocabulary.
4. Run the entire design, content, behavior, and release verification suite on the second branch independently.

Required evidence: branch graph, scope diff showing visual-only structural changes, complete test results, and a second set of responsive screenshots.

## Phase 6 — completion audit and release decision

Status: **in progress; the changed local candidate still requires the complete release/browser record, and every provider/deployment action remains separately gated**.

1. Re-run all repository checks from a clean install.
2. Walk every public route and every notification state at desktop and mobile widths.
3. Revalidate GitHub links and any live repository facts.
4. Review the built browser assets and repository history for secrets, private paths, private URLs, customer data, and unexpected font or component assets.
5. Fill every applicable row in the [completion matrix](requirement-evidence-matrix.md) with direct, current evidence.
6. Keep preview readiness distinct from production readiness. Do not mark production complete until provider state, live migration, delivery, deployment, and domain behavior are all verified in the approved production environment.

## Exit condition

Completion requires every applicable matrix row to be `Proven`, no unresolved severity-one or severity-two defect, no skipped required check, and no unverified external state. Only then may the final handoff end with the exact sentence:

> Everything requested works. Stop.
