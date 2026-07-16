# Requirement-to-evidence completion matrix

This is the live completion ledger. Replace placeholders with direct, current evidence. Allowed statuses are `Pending`, `In progress`, `Proven`, `Failed`, and `Not applicable`. Use `Proven` only when the cited evidence covers the full requirement.

## Current matrix

| ID | Requirement | Required proof | Current status | Evidence or next proof |
| --- | --- | --- | --- | --- |
| R-01 | Authoritative objective, supplied component references, and reference image were read before implementation decisions | Read record plus requirements trace | Proven | Goal audit reread `goal-objective.md`, both referenced component files, and the supplied image before final branch verification |
| R-02 | Fresh work begins from a parentless empty Git root without disturbing the legacy checkout | Git graph, empty-tree comparison, worktree status | Proven | Parentless empty root `9313f31`; legacy history remains preserved at `archive/pre-redesign-20260716`; both implementation worktrees ended clean |
| R-03 | The app uses React/Vite or another allowed non-Next framework | Manifest, lockfile, source/import scan, build | Proven | React 19 + Vite 6 manifest, no Next dependency/import, and clean production builds on both design branches |
| R-04 | Existing Vercel project and domain configuration are preserved rather than recreated | Redacted before/after provider inspection | Proven | Existing linked Vercel project was reused; the production deployment remained aliased to `cumulush.com` without recreating the project or domain |
| R-05 | Literal branch follows the supplied reference's visual structure without copying third-party copy or media | Responsive comparison evidence and content review | Proven | The reconciled literal branch retains original Cumulus copy/media and the reference editorial hierarchy; its renewed desktop/mobile browser suite passes |
| R-06 | A cloned branch provides an independently designed visual structure only | Branch graph, visual-only scope diff, full verification | Proven | `c9d2b49` records the initial visual delta; after reconciliation, the two branch tips differ only in `src/styles.css`, preserving a reviewable visual-only boundary |
| R-07 | Brand uses pure black, gray text roles, and minimal intense orange | Token inspection and rendered contrast review | Proven | Closed token set in `BRAND_GUIDELINES.md` and `src/styles.css`; rendered desktop/mobile checks show black/neutral hierarchy with orange limited to signal roles |
| R-08 | Only supplied Jacquard font variants are used | Font inventory, CSS/build/network inspection, OFL evidence | Proven | Build emits only Jacquard 12, Jacquard 24, and Jacquarda Bastarda 9; computed rendered families match; license gate passes |
| R-09 | Visuals use only the approved dither, edge-blur, hero-dither vocabulary or faithful derivatives | Dependency/source inventory and rendered review | Proven | Component inventory is limited to the documented Dither Image, Hero Dither, and Edge Blur derivatives plus semantic product UI; provenance/license tests pass |
| R-10 | Home is intentionally large with dominant `CUMULUS`, tiny `lab`, and the public `ocque41` GitHub graph | Desktop/mobile screenshots, graph states, source/API review | Proven | Live browser proof: dominant `CUMULUS`, subordinate `lab`, 371 graph slots, 369 observed days, live/fallback/loading states, no page overflow, fixed `ocque41` source |
| R-11 | Authorized local projects and their public GitHub repositories are analyzed safely | Public-safe inventory, claim ledgers, current primary-source records | Proven | The [post claim ledger](post-claim-ledger.md) records 24 reviews across six anonymously reachable repositories without publishing private provenance; every claim row cites an immutable public source snapshot |
| R-12 | At least twenty substantial mixed-project posts are published | Content validator, manual depth review, published count | Proven | Focused content tests pass 14/14 for 24 published posts across six projects; ledger parity is exact and body prose ranges from 624 to 729 words |
| R-13 | Every post has a large route, public source backlinks, and valid related-post backlinks | Route crawl, link check, responsive screenshots | Proven | Desktop/mobile browser tests directly crawl all 24 routes; content tests validate related links and draft exclusion; all 70 unique immutable source URLs return successfully |
| R-14 | Home, post pages, and footer use abundant but readable dither composition | Responsive screenshots, accessibility and performance review | Proven | Rendered home, article, graph, and footer walkthroughs preserve crisp prose/controls while using shader and static dither layers at all audited widths |
| R-15 | Sign-in is functional and limited to notification consent/preferences | Auth tests plus preview walkthrough | In progress | Dialog, PKCE callback, explicit consent, sign-out, focus, and failure tests pass; a real production magic-link receipt remains unverified |
| R-16 | Resend new-post delivery is functional, consented, accessible, and unsubscribable | API/RLS/retry tests plus controlled delivery and unsubscribe receipt | In progress | Delivery/unsubscribe code and tests pass; the enabled production Resend webhook now has its signing secret loaded and rejects an unsigned probe with `400 invalid_webhook`. Publish remains fail-closed until a truthful sender postal address and controlled receipt/unsubscribe/suppression proof exist |
| R-17 | Delivery is atomic, lease-based, retry-safe, and idempotent | Database constraints/RPC tests and concurrent failure scenarios | Proven | Notification migration, lease, retry, idempotency, crash-recovery, duplicate-suppression, and provider-boundary tests pass; production migrations are applied |
| R-18 | Production secrets are injected directly into the existing Vercel project without disclosure | Redacted provider evidence and source/build secret scans | Proven | Required secrets are stored as sensitive production environment values; source/build scans pass and the broad GitHub token was removed in favor of the public fixed-user endpoint |
| R-19 | Public planning, agent handoff, third-party skill inventory, reusable research skill, and per-post public claim ledger exist | Repository paths, skill validation, link check | Proven | `planning/`, `agents/`, [`planning/post-claim-ledger.md`](post-claim-ledger.md), and `skills/project-post-research/` |
| R-20 | Both designs are responsive, accessible, reduced-motion safe, and usable without WebGL/provider availability | Complete design checklist, automated accessibility checks, fallback walkthroughs | Proven | Both reconciled branches pass desktop/mobile E2E; primitive tests cover reduced motion, WebGL failure, static fallbacks, focus, and dialog behavior; coarse pointers use the labeled day selector |
| R-21 | Lint, typecheck, unit, build, security, license, and end-to-end checks pass from a clean install | Current unabridged command outputs and coverage review | Proven | Both branch tips pass lint, dual TypeScript compilation, 142 unit tests, build with 26 static routes, public-safety scan, license check, and 9 browser tests with one intentional desktop skip; the selected branch also has a zero-vulnerability audit |
| R-22 | Live domain serves the selected proven commit and production notification flow works | Production URL checks, commit linkage, controlled live lifecycle | In progress | Vercel reports `main@4530cea` READY in Production after a same-source redeploy loaded the webhook secret; the live alias, interactive graph, metadata, crawler files, fixed-user API, 404, and invalid-signature webhook rejection pass. Notification publishing remains fail-closed pending the truthful postal address and controlled lifecycle evidence |
| R-23 | Final completion statement is made only after every applicable row is proven | Final matrix audit with no missing evidence | Pending | End with the required exact sentence only after proof |

## Evidence record template

Add one record per proof artifact. Do not paste secrets, subscriber data, private URLs, or machine-specific paths.

| Evidence ID | Requirement IDs | Branch/commit | Command or inspection | UTC timestamp | Result | Public-safe artifact/link | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `E-001` | `R-01,R-02,R-03` | `fresh-start-base@9313f31` | Objective/reference reread; `git show`; empty-tree and manifest/import inspection | `2026-07-16T16:04:35Z` | Pass | Parentless empty root and React/Vite source | Primary agent |
| `E-002` | `R-05,R-08,R-09,R-20,R-21` | `request/jacquard-reference@c6a444b` | Lint; dual typecheck; 142 unit tests; build; security/license checks; 9 local browser tests with one desktop-only skip | `2026-07-16` | Pass | Reference branch and this matrix | Primary agent |
| `E-003` | `R-06,R-07,R-10,R-13,R-14,R-20,R-21` | `request/cumulus-original@f156776` | Lint; dual typecheck; 142 unit tests; build; 9 local and 9 production browser tests with one desktop-only skip in each run | `2026-07-16` | Pass | Production branch and this matrix | Primary agent |
| `E-004` | `R-04,R-18,R-22` | `main@4530cea` | Redacted Vercel inspection; exact production redeploy `READY`; alias, static metadata, 404, fixed-user API, and invalid-signature webhook review | `2026-07-16` | Partial | `https://cumulush.com` | Primary agent |
| `E-005` | `R-11,R-12,R-13,R-19` | selected release candidate | Post/ledger parity tests, 24-route desktop/mobile crawl, and 70-source URL validation | `2026-07-16` | Pass | `planning/post-claim-ledger.md` | Primary agent |
| `E-006` | `R-15,R-16,R-17,R-22,R-23` | `main@4530cea` | Auth/notification tests; enabled three-event Resend webhook; redacted Production env-name audit; live `400 invalid_webhook` signature probe | `2026-07-16` | Partial | Missing truthful postal address and controlled magic-link, delivery, unsubscribe, and suppression evidence | Primary agent |

## Completion audit rules

1. Re-run drift-prone checks immediately before release.
2. Cite complete output or a durable artifact, not a paraphrased success claim.
3. Confirm each test actually covers the requirement assigned to it.
4. Keep preview proof separate from production proof.
5. Treat missing, indirect, stale, or redacted-beyond-verification evidence as not proven.
6. If a requirement fails, fix the implementation and repeat the full affected verification chain.
7. Do not change a requirement to make existing work appear complete.
