# AGENTS.md

This repository is the public Cumulus 0.0.8 build. Treat every tracked file as public: do not add secrets, production identifiers, customer data, private URLs, or operational notes.

## Source of truth

- `README.md` describes the product, supported commands, and setup.
- `BRAND_GUIDELINES.md` defines the visual and component constraints.
- `docs/notifications.md` defines notification consent, delivery, and unsubscribe behavior.
- `docs/licensing.md` and `NOTICE` define the code and font licensing boundary.
- `docs/private-overlay.md` defines what must remain outside this repository.
- `docs/vercel-cutover.md` defines the preview-first path to the existing Vercel project.
- `docs/public-release.md` is the release checklist.

If code and documentation disagree, inspect the code, fix the stale side when it is in scope, and report the mismatch.

## Product boundary

Cumulus is a React and Vite blog for public logs. The only reader identity feature is an email notification preference for new posts. Do not grow it into profiles, social features, paid accounts, or a general authentication system without a new product decision.

The literal layout study is `request/jacquard-reference`. The independently composed and selected production design is `request/cumulus-original`, published through `main`. Shared product, content, accessibility, and security changes must be reconciled across both design branches; visual structure may differ.

## Public and private boundary

This repository is Apache-2.0 code. It contains no AGPL provider or AGPL-derived source. Do not import AGPL code into it.

Safe public material includes UI, tests, public API contracts, additive migration source, placeholder configuration, and self-hosting documentation. Real Vercel, Supabase, Resend, domain, tenant, customer, admin, publishing, or deployment values belong in the deployment platforms or a private production overlay.

All `NEXT_PUBLIC_*` values are deliberately browser-visible. The compatibility prefix is retained in this Vite app so an existing deployment can keep its public environment-variable names; it does not make this a Next.js project.

## Brand and components

- Use `#000000` as the canvas and structural black.
- Use neutral gray tones for all text and dividers.
- Use `#ff4d00` only for small, high-contrast accents and focus/status details.
- Use the supplied Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9 fonts, plus operator-licensed Alcyone Medium for body reading copy only. Preserve every heading, navigation, control, label, and metadata font. The charted variants are intentionally excluded, and no Alcyone binary, archive, license PDF, or encoded value may enter Git or browser build output; Local and Preview use the Jacquard fallback.
- Do not add another UI kit. The allowed component vocabulary is Tripwire Dither Kit, Dither Image, Edge Blur, Hero Dithering, and faithful locally authored derivatives.
- Native semantic HTML is allowed and preferred. It is not a second component system.
- A pasted Next.js component is a visual reference only. Port behavior to React/Vite; do not introduce Next.js or `next/image`.
- Preserve keyboard operation, visible focus, reduced-motion behavior, meaningful headings, and readable contrast.

## Notification safety

- Subscription must require an explicit user action and clear new-post wording.
- Normalize email addresses consistently and rely on a database uniqueness rule.
- Unsubscribe must be accessible from every message and must take effect without requiring an account password.
- Publishing is a privileged server-side action protected by `NOTIFICATION_PUBLISH_SECRET`.
- Unsubscribe tokens are signed with `NOTIFICATION_UNSUBSCRIBE_SECRET`; never expose that secret to browser code or logs.
- Delivery retries must be idempotent. A retry must not send the same publication event to the same active subscriber twice.
- The Supabase service-role key and Resend API key are server-only.

## Change rules

- Read the owning file, its caller, and focused tests before changing behavior.
- Keep changes surgical and deterministic. Add focused tests for changed rules.
- Update public documentation when public behavior or configuration changes.
- Run the narrowest relevant checks, then the complete release set before claiming release readiness.
- Do not commit generated secrets, local `.env` files, database dumps, or delivery logs.
- Do not push a branch, replace `main`, run a live migration, attach or change a production domain, or deploy to production without the corresponding explicit approval.

Expected checks:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run security:scan
npm run license:check
npm run test:e2e
```

## Working assumptions

State any changed assumption in the handoff. The current assumptions are:

1. The existing Vercel project, Git integration, and domain are managed externally and must be retained; live linkage requires provider evidence rather than inference from Git.
2. No domain configuration is stored in Git.
3. Candidate deployment and verification precede any approved `main` update; `request/cumulus-original` is the selected visual branch.
4. Supabase receives an additive migration; existing production objects are not dropped, renamed, or rewritten by this work.
5. Resend sends only consented new-post notifications.
6. Production credentials and private legal/operational records live outside the public repository.
7. Main replacement, push/publication, live database migration, and production cutover are separate explicit gates.
