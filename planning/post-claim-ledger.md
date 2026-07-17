# Focused first-party journal claim ledger

This ledger covers the twenty published posts exported by `src/content/posts.ts`: eight Requisia journals, seven Insuja journals, three Hyoka Hanesu journals, and two gy journals. It replaces the retired multi-repository review ledger.

Every entry uses the **first-party journal** mode defined in [source-evidence-policy](source-evidence-policy.md). The articles are maintainer-authored, public-safe explanations of product reasoning and observed local constraints. Their underlying repositories and implementation evidence are private, so the posts intentionally contain no `sourceLinks`. An absent link is not missing proof disguised as proof: it is an explicit statement that an anonymous reader cannot reproduce the private implementation observation from this repository.

The review date records when the public copy and its disclosure boundary were checked. It does not verify deployment, production use, security, performance, scale, reliability, adoption, provider state, or customer outcomes.

| Published slug | Project | Mode | Public claim boundary | Reviewed | Explicitly not claimed |
| --- | --- | --- | --- | --- | --- |
| `requisia-organization-scoped-registers` | Requisia | First-party journal | Why procurement registers need stable meaning across browser and workbook views | 2026-07-17 | Public source, live organization behavior, or production correctness |
| `requisia-preview-before-apply` | Requisia | First-party journal | Why bulk workbook changes should be reviewed before becoming authoritative state | 2026-07-17 | A deployed import pipeline, lossless handling of every workbook, or recovery proof |
| `requisia-current-workbook-pointer` | Requisia | First-party journal | Why an authoritative workbook should be selected deliberately instead of regenerated implicitly | 2026-07-17 | Live storage configuration, retained version history, or restoration success |
| `requisia-portal-and-document-assignments` | Requisia | First-party journal | Why seeing a business record and receiving a private document are different grants | 2026-07-17 | Production authorization, real recipient isolation, or security certification |
| `requisia-rfq-package-contract` | Requisia | First-party journal | Why an RFQ package should compose existing records and explicit attachments instead of creating a second truth | 2026-07-17 | A deployed vendor workflow, customer use, or complete attachment enforcement |
| `requisia-session-derived-authority` | Requisia | First-party journal | Why one entry flow does not imply one level of authority across procurement roles | 2026-07-17 | Identity-provider configuration, live role isolation, or recovery readiness |
| `requisia-private-object-delivery` | Requisia | First-party journal | Why private documents need authenticated delivery rather than obscured addresses | 2026-07-17 | Provider configuration, production object privacy, or complete abuse resistance |
| `requisia-composite-readiness` | Requisia | First-party journal | Why readiness must combine application, dependency, recovery, and operator evidence | 2026-07-17 | A green production gate, customer readiness, or successful disaster recovery |
| `insuja-typed-tenant-boundaries` | Insuja | First-party journal | Why deal scope should be explicit at boundaries instead of reconstructed from convenient strings | 2026-07-17 | Public source, production tenant isolation, or formal verification |
| `insuja-identity-assurance-separation` | Insuja | First-party journal | Why successful login is only an input to a separate data-permission decision | 2026-07-17 | Live federation, complete revocation, or production access-control proof |
| `insuja-revocable-permission-proofs` | Insuja | First-party journal | Why sensitive deal access should remain bounded and revocable after an initial decision | 2026-07-17 | Cryptographic certification, race-free distributed revocation, or deployed policy correctness |
| `insuja-seller-controlled-releases` | Insuja | First-party journal | Why seller disclosure should be an explicit workflow rather than a broadly shared folder | 2026-07-17 | A completed pilot, production recipient enforcement, or legal sufficiency |
| `insuja-buyer-command-workspaces` | Insuja | First-party journal | Why buyer analysis and notes need a separate private boundary around seller releases | 2026-07-17 | Real deal isolation, production reporting, or customer adoption |
| `insuja-formal-requests-and-qa` | Insuja | First-party journal | Why requests and answers benefit from explicit shared state and bounded transitions | 2026-07-17 | Deployed notification delivery, full lifecycle recovery, or participant behavior |
| `insuja-permission-safe-search-feed` | Insuja | First-party journal | Why discovery needs reconciliation while current permission remains authoritative | 2026-07-17 | A production index, zero leakage, complete freshness, or measured scale |
| `hyoka-opt-in-repository-access` | Hyoka Hanesu | First-party journal | Why a local repository assistant should receive deliberate, visible access rather than ambient reach | 2026-07-17 | Public distribution, operating-system containment, or protection against every tool misuse |
| `hyoka-context-budgets` | Hyoka Hanesu | First-party journal | Why context selection and limits are part of product behavior rather than an invisible token calculation | 2026-07-17 | Universal model quality, benchmark superiority, or production resource guarantees |
| `hyoka-provider-boundaries` | Hyoka Hanesu | First-party journal | Why local and service-backed model paths need explicit capability and data boundaries | 2026-07-17 | Provider privacy, equivalent model behavior, notarized release, or live service reliability |
| `gy-git-trust-boundaries` | gy | First-party journal | Why an assembly Git prototype must make parsing and interoperability boundaries unusually legible | 2026-07-17 | Compatibility with all Git behavior, memory safety, or a qualified release |
| `gy-qualification-before-release` | gy | First-party journal | Why prototype progress should be reported separately from strict release qualification | 2026-07-17 | Passing independent profiles, production suitability, or external review closure |

## Review disposition

- Exactly twenty published slugs are represented once in the required `8 / 7 / 3 / 2` allocation.
- No row exposes a repository location, local path, branch, issue, provider identifier, customer record, credential, private URL, or operational value.
- No row invents a public backlink for a private project.
- Article copy must remain original and topic-specific, with explicit local-evidence and production-evidence limits.
- Re-run the ledger parity, privacy scan, backlink validation, word-count check, static-route build, and rendered-route review whenever a slug, project allocation, material claim, or publication mode changes.
