# Requirement-to-evidence completion matrix

This is the live completion ledger. Replace placeholders with direct, current evidence. Allowed statuses are `Pending`, `In progress`, `Proven`, `Failed`, and `Not applicable`. Use `Proven` only when the cited evidence covers the full requirement.

## Current matrix

| ID | Requirement | Required proof | Current status | Evidence or next proof |
| --- | --- | --- | --- | --- |
| R-01 | Authoritative objective, supplied component references, and reference image were read before implementation decisions | Read record plus requirements trace | In progress | Reconfirm the requirements trace during final audit |
| R-02 | Fresh work begins from a parentless empty Git root without disturbing the legacy checkout | Git graph, empty-tree comparison, worktree status | In progress | Capture final Git commands and commit identifiers |
| R-03 | The app uses React/Vite or another allowed non-Next framework | Manifest, lockfile, source/import scan, build | In progress | Re-run after clean install |
| R-04 | Existing Vercel project and domain configuration are preserved rather than recreated | Redacted before/after provider inspection | Pending | External provider gate |
| R-05 | Literal branch follows the supplied reference's visual structure without copying third-party copy or media | Responsive comparison evidence and content review | In progress | Complete design checklist |
| R-06 | A cloned branch provides an independently designed visual structure only | Branch graph, visual-only scope diff, full verification | Pending | Create only after reference branch is proven |
| R-07 | Brand uses pure black, gray text roles, and minimal intense orange | Token inspection and rendered contrast review | In progress | Complete design checklist |
| R-08 | Only supplied Jacquard font variants are used | Font inventory, CSS/build/network inspection, OFL evidence | In progress | Re-run font and license checks |
| R-09 | Visuals use only the approved dither, edge-blur, hero-dither vocabulary or faithful derivatives | Dependency/source inventory and rendered review | In progress | Complete component provenance and design checklist |
| R-10 | Home is intentionally large with dominant `CUMULUS`, tiny `lab`, and the public `ocque41` GitHub graph | Desktop/mobile screenshots, graph states, source/API review | In progress | Verify all graph and fallback states |
| R-11 | Authorized local projects and their public GitHub repositories are analyzed safely | Public-safe inventory, claim ledgers, current primary-source records | Proven | The [post claim ledger](post-claim-ledger.md) records all 24 public-source reviews without publishing private provenance; five context-only rows are explicitly limited and are not implementation evidence |
| R-12 | At least twenty substantial mixed-project posts are published | Content validator, manual depth review, published count | Proven | Focused content tests pass 14/14 for 24 published posts; ledger parity is exact and reviewed prose ranges from 700 to 767 words |
| R-13 | Every post has a large route, public source backlinks, and valid related-post backlinks | Route crawl, link check, responsive screenshots | In progress | Resolve all published routes and links |
| R-14 | Home, post pages, and footer use abundant but readable dither composition | Responsive screenshots, accessibility and performance review | In progress | Complete design checklist |
| R-15 | Sign-in is functional and limited to notification consent/preferences | Auth tests plus preview walkthrough | In progress | Verify callback and session lifecycle in preview |
| R-16 | Resend new-post delivery is functional, consented, accessible, and unsubscribable | API/RLS/retry tests plus controlled delivery and unsubscribe receipt | In progress | Complete preview provider gates |
| R-17 | Delivery is atomic, lease-based, retry-safe, and idempotent | Database constraints/RPC tests and concurrent failure scenarios | In progress | Prove crash recovery and duplicate suppression |
| R-18 | Production secrets are injected directly into the existing Vercel project without disclosure | Redacted provider evidence and source/build secret scans | Pending | External production mutation gate |
| R-19 | Public planning, agent handoff, third-party skill inventory, reusable research skill, and per-post public claim ledger exist | Repository paths, skill validation, link check | Proven | `planning/`, `agents/`, [`planning/post-claim-ledger.md`](post-claim-ledger.md), and `skills/project-post-research/` |
| R-20 | Both designs are responsive, accessible, reduced-motion safe, and usable without WebGL/provider availability | Complete design checklist, automated accessibility checks, fallback walkthroughs | Pending | Verify both branches independently |
| R-21 | Lint, typecheck, unit, build, security, license, and end-to-end checks pass from a clean install | Current unabridged command outputs and coverage review | Pending | Run after integration stabilizes |
| R-22 | Live domain serves the selected proven commit and production notification flow works | Production URL checks, commit linkage, controlled live lifecycle | Pending | Production verification gate |
| R-23 | Final completion statement is made only after every applicable row is proven | Final matrix audit with no missing evidence | Pending | End with the required exact sentence only after proof |

## Evidence record template

Add one record per proof artifact. Do not paste secrets, subscriber data, private URLs, or machine-specific paths.

| Evidence ID | Requirement IDs | Branch/commit | Command or inspection | UTC timestamp | Result | Public-safe artifact/link | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `E-000` | `R-00` | `branch@commit` | Exact check or inspection | `YYYY-MM-DDThh:mm:ssZ` | Pass/Fail | Path or redacted note | Role |

## Completion audit rules

1. Re-run drift-prone checks immediately before release.
2. Cite complete output or a durable artifact, not a paraphrased success claim.
3. Confirm each test actually covers the requirement assigned to it.
4. Keep preview proof separate from production proof.
5. Treat missing, indirect, stale, or redacted-beyond-verification evidence as not proven.
6. If a requirement fails, fix the implementation and repeat the full affected verification chain.
7. Do not change a requirement to make existing work appear complete.
