export type PostStatus = "published" | "draft";

export type PostPlacement =
  | "featured"
  | "feature-rail"
  | "recent"
  | "stories"
  | "research"
  | "build-business";

export type DitherVariant =
  | "cloud-gate"
  | "signal-window"
  | "terminal-rain"
  | "archive-lines"
  | "split-horizon"
  | "key-vault"
  | "paper-field"
  | "local-orbit"
  | "record-lattice"
  | "release-bars"
  | "shared-notebook"
  | "event-river"
  | "handoff-map"
  | "compact-grid"
  | "plan-stack"
  | "context-rings"
  | "cost-contours"
  | "contract-bridge"
  | "workspace-beacon";

export interface PostVisual {
  variant: DitherVariant;
  alt: string;
}

export interface PostBodySection {
  heading: string;
  paragraphs: readonly string[];
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  status: PostStatus;
  /** Public display date, or the planned display date for a draft. */
  date: string;
  category: string;
  tags: readonly string[];
  readingTime: number;
  placement: PostPlacement;
  visual: PostVisual;
  body: readonly PostBodySection[];
  project?: string;
  sourceLinks?: readonly { label: string; href: string }[];
  relatedSlugs?: readonly string[];
  /** Date on which drift-prone public and repository claims were last checked. */
  verifiedAt?: string;
}

const PUBLICATION_DATE = "2026-07-16";
const RESEARCH_VERIFIED_AT = "2026-07-16";

const PUBLIC_REPOSITORIES_SOURCE = {
  label: "Explore public work — repositories",
  href: "https://github.com/ocque41?tab=repositories",
} as const;

const GIT_UPSTREAM_SOURCE = {
  label: "Git upstream repository",
  href: "https://github.com/git/git",
} as const;

const PLATFORM_SOURCE = {
  label: "Explore Cumulus Platform",
  href: "https://platform.cumulush.com",
} as const;

const NIST_ZERO_TRUST_SOURCE = {
  label: "NIST SP 800-207 — Zero Trust Architecture",
  href: "https://csrc.nist.gov/pubs/sp/800/207/final",
} as const;

const NIST_ABAC_SOURCE = {
  label: "NIST SP 800-162 — Attribute Based Access Control",
  href: "https://csrc.nist.gov/pubs/sp/800/162/upd2/final",
} as const;

const RFC_AEAD_SOURCE = {
  label: "RFC 5116 — Authenticated Encryption",
  href: "https://www.rfc-editor.org/rfc/rfc5116.html",
} as const;

const NIST_AI_RMF_SOURCE = {
  label: "NIST AI Risk Management Framework 1.0",
  href: "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
} as const;

const REPRODUCIBLE_BUILDS_SOURCE = {
  label: "Reproducible Builds — definition",
  href: "https://reproducible-builds.org/docs/definition/",
} as const;

const SLSA_SOURCE = {
  label: "SLSA specification 1.2",
  href: "https://slsa.dev/spec/v1.2/",
} as const;

const GIT_LS_FILES_SOURCE = {
  label: "Git ls-files documentation",
  href: "https://git-scm.com/docs/git-ls-files",
} as const;

const TOML_SPEC_SOURCE = {
  label: "TOML 1.0 specification",
  href: "https://toml.io/en/v1.0.0",
} as const;

const JSON_RPC_SOURCE = {
  label: "JSON-RPC 2.0 specification",
  href: "https://www.jsonrpc.org/specification",
} as const;

const JSON_SCHEMA_SOURCE = {
  label: "JSON Schema 2020-12 specification",
  href: "https://json-schema.org/specification",
} as const;

const RFC_HTTP_SOURCE = {
  label: "RFC 9110 — HTTP semantics",
  href: "https://www.rfc-editor.org/rfc/rfc9110.html",
} as const;

const NIST_CONTINGENCY_SOURCE = {
  label: "NIST SP 800-34 — contingency planning",
  href: "https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final",
} as const;

const GITHUB_VISIBILITY_SOURCE = {
  label: "GitHub documentation — repository visibility",
  href: "https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories",
} as const;

const W3C_MOTION_SOURCE = {
  label: "W3C WCAG — animation from interactions",
  href: "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions",
} as const;

const CODEX_CLI_SOURCE = {
  label: "OpenAI Codex CLI guide",
  href: "https://developers.openai.com/codex/cli/",
} as const;

const APPLE_CONTAINER_SOURCE = {
  label: "Apple container machine documentation",
  href: "https://github.com/apple/container/blob/main/docs/container-machine.md",
} as const;

function section(
  heading: string,
  firstParagraph: string,
  secondParagraph: string,
): PostBodySection {
  return { heading, paragraphs: [firstParagraph, secondParagraph] };
}

const BASE_POSTS: readonly Post[] = [
  {
    slug: "trust-root-before-product-surface",
    title: "Build the trust root before the product surface",
    excerpt:
      "An original Room-labeled lab analysis asks how storage, identity, tenancy, audit, and cryptographic boundaries can precede product polish.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Architecture",
    tags: ["trust boundaries", "scope", "security engineering"],
    readingTime: 0,
    placement: "featured",
    visual: {
      variant: "cloud-gate",
      alt: "A dense black dither foundation supporting a narrow open product frame.",
    },
    project: "Room",
    sourceLinks: [NIST_ZERO_TRUST_SOURCE],
    relatedSlugs: [
      "three-boundaries-one-workflow",
      "envelope-encryption-as-protocol",
      "completion-is-a-proof-obligation",
    ],
    body: [
      section(
        "Begin below the interface",
        "Security-sensitive software is easiest to overstate when the visible surface arrives before the rules beneath it. This original Room-labeled lab analysis proposes starting with storage, identity, tenancy, audit, and cryptographic invariants while keeping interface, provider, billing, and compliance questions outside the first proof. It makes no claim about a public Room implementation.",
        "That ordering changes what a prototype is allowed to communicate. A polished screen can suggest that a workflow is already operated, reviewed, or safe for real transactions; a trust-root-first program instead asks whether every read, write, release, and verification step has an explicit authority before presentation becomes the narrative.",
      ),
      section(
        "Assign responsibilities instead of hiding defaults",
        "A reviewable architecture maps responsibilities across trust components and the adapters that call them. Tenant, workspace, party, audit, and cryptographic modes can be explicit inputs rather than ambient context, so a caller cannot quietly inherit a security decision from whichever process happened to launch it.",
        "This is not a claim that low-level foundations automatically create a secure product. It is a way to make later review tractable: each adapter can be judged against a named contract, and missing deployment controls remain visible instead of being absorbed into an optimistic description of the whole system.",
      ),
      section(
        "Keep prototype language honest",
        "The most important artifact may be the list of exclusions. A lab analysis can state that its trust root is hypothetical, that no deployment is being claimed, and that operational providers remain outside the evidence, preventing conceptual source material from being mistaken for service readiness.",
        "Scope honesty also improves engineering decisions. When the team does not need to defend an inflated product claim, it can concentrate on proving the next invariant and can add interfaces only when they preserve the boundaries already established underneath them.",
      ),
    ],
  },
  {
    slug: "three-boundaries-one-workflow",
    title: "Three data boundaries inside one workflow",
    excerpt:
      "Buyer-private, seller-private, and deliberately shared material need different authorization semantics even when a product presents one room.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Security",
    tags: ["authorization", "tenancy", "controlled disclosure"],
    readingTime: 0,
    placement: "feature-rail",
    visual: {
      variant: "split-horizon",
      alt: "Three separated gray dither fields meet at one audited orange crossing.",
    },
    project: "Room",
    sourceLinks: [NIST_ABAC_SOURCE],
    relatedSlugs: [
      "trust-root-before-product-surface",
      "drafts-without-publication-authority",
      "file-link-is-not-authorization",
    ],
    body: [
      section(
        "A room is not one permission domain",
        "A transaction workspace may look like a shared folder, but its participants do not enter with interchangeable authority. This original Room-labeled analysis distinguishes party-A material, party-B material, and a deliberately shared workflow so that one convenient product noun does not erase the direction in which information may travel. It does not claim a public Room source or implementation.",
        "The distinction matters most at the quiet edges. Buyer analysis should not flow back to the seller simply because both parties can see a deal identifier, and seller material should cross into shared space only through a release action that can be attributed and audited.",
      ),
      section(
        "Derive storage from the same boundary",
        "Authorization is harder to reason about when the storage namespace tells a different story. A hypothetical design can derive placement from tenant and workflow context, keeping physical organization aligned with the parties and scopes used by policy rather than trusting a caller-supplied path convention.",
        "This does not turn a namespace into access control by itself. It creates a second, inspectable expression of the same rule, which makes accidental cross-tenant or cross-party routing easier to detect in tests and harder to conceal behind a generic object identifier.",
      ),
      section(
        "Make every crossing an event",
        "A shared workflow becomes safer when disclosure is a transition, not an incidental read. The system can record who approved a release, which bounded material moved, and which policy context permitted it without publishing the private payload as part of the audit trail.",
        "Synthetic diagrams are enough to teach this model publicly. Real participant names, document identifiers, transaction details, and operational records add no architectural value to the explanation and would weaken the very boundary the design is intended to protect.",
      ),
    ],
  },
  {
    slug: "envelope-encryption-as-protocol",
    title: "Envelope encryption is a protocol, not a checkbox",
    excerpt:
      "Auditable document encryption names framing, context, metadata, nonce behavior, key routing, and failure publication instead of stopping at an algorithm label.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Research",
    tags: ["envelope encryption", "metadata", "fail closed"],
    readingTime: 0,
    placement: "feature-rail",
    visual: {
      variant: "key-vault",
      alt: "Bounded pixel frames surround a small key marker without revealing content.",
    },
    project: "Room",
    sourceLinks: [RFC_AEAD_SOURCE],
    relatedSlugs: [
      "trust-root-before-product-surface",
      "parse-completely-publish-once",
      "one-budget-equation-every-backend",
    ],
    body: [
      section(
        "Specify the bytes around the cipher",
        "Naming an authenticated cipher does not define a document format. This original Room-labeled analysis proposes bounded frames, per-document key behavior, tenant and file context, and a strict metadata grammar because interoperability and review depend on the bytes surrounding encryption as much as on the primitive. It does not describe a public Room format or implementation.",
        "Explicit framing puts resource limits into the protocol. A reader can reject an oversized or malformed frame before it allocates unbounded memory, while context binding makes an otherwise valid ciphertext unusable when it is presented as a different tenant or file.",
      ),
      section(
        "Publish plaintext only after complete verification",
        "Authenticated reads need a publication rule, not merely a verification call. The secure-storage boundary verifies the requested object before making plaintext caller-visible and refuses to expose a partially processed result when metadata, context, or authentication fails.",
        "That pattern resembles a transaction: work can occur in private scratch state, but observable output changes once, after every condition succeeds. It is useful beyond encryption because it turns a complicated failure path into a simple promise to the caller.",
      ),
      section(
        "Do not promote local evidence into a production claim",
        "A local design exercise does not establish managed key protection, hardware-backed custody, certification, operational rotation, or production encryption at rest. An essay should not smuggle those absent controls in through familiar security terminology, and this one makes no such project claim.",
        "Careful qualification makes the technical lesson stronger. Readers can inspect the protocol decisions as a design exercise without being asked to believe that a local key router has already become a production key-management system.",
      ),
    ],
  },
  {
    slug: "drafts-without-publication-authority",
    title: "Let AI draft without granting publication authority",
    excerpt:
      "Permission-safe assistance reauthorizes every source, records lineage, treats outputs as untrusted, and reserves release for a separate human decision.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "AI Systems",
    tags: ["AI governance", "human approval", "lineage"],
    readingTime: 0,
    placement: "feature-rail",
    visual: {
      variant: "signal-window",
      alt: "A noisy draft field stops at a crisp human approval boundary.",
    },
    project: "Room",
    sourceLinks: [NIST_AI_RMF_SOURCE],
    relatedSlugs: [
      "no-silent-local-to-remote",
      "save-is-not-run",
      "completion-is-a-proof-obligation",
    ],
    body: [
      section(
        "Permission must survive the prompt boundary",
        "A person who may read one source in one workflow has not automatically authorized that source for every model or future task. This original Room-labeled analysis proposes exact source scope, reauthorization, and fail-closed provider assumptions; it does not claim that a public Room implementation currently enforces them.",
        "This makes lineage a control instead of a footnote. An artifact can state which bounded sources contributed to it and which permission context was checked, giving a reviewer a way to challenge the provenance before considering the content itself.",
      ),
      section(
        "Pending review is a real state",
        "Generated material begins as an untrusted proposal with no publication surface. The agent boundary can draft or simulate within a permit, but it does not receive a side-effect capability that would let fluent output become a disclosure, decision, or externally visible record.",
        "A separate approval transition keeps the reviewer meaningful. If the same automated step both produces and releases an artifact, a status called pending review is cosmetic; if release requires a different authority, the state carries enforceable semantics.",
      ),
      section(
        "Bound the claim with the implementation",
        "These rules describe a reference boundary, not an active production AI provider. They do not establish automated legal, investment, disclosure, or publication decisions, and they should not be used to imply that a model has been granted those responsibilities elsewhere in the product.",
        "The reusable lesson is modest and practical: separate imagination from authority, preserve the evidence needed for review, and make every externally consequential action pass through code and permissions that do not depend on the model declaring itself confident.",
      ),
    ],
  },
  {
    slug: "assembly-makes-assumptions-visible",
    title: "Assembly makes every forge assumption visible",
    excerpt:
      "An x86-64 Git-forge prototype exposes parser bounds, ownership, ABI behavior, and syscall errors that higher layers often leave implicit.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Build",
    tags: ["assembly", "Git", "bounded systems"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "terminal-rain",
      alt: "Rigid rows of assembly-like pixels converge on a bounded forge shape.",
    },
    project: "gy",
    sourceLinks: [GIT_UPSTREAM_SOURCE],
    relatedSlugs: [
      "reproducible-builds-evidence-contract",
      "parse-completely-publish-once",
      "backlinks-that-do-not-pretend",
    ],
    body: [
      section(
        "A prototype with nowhere to hide allocation",
        "This original gy-labeled lab analysis asks what a hypothetical x86-64 assembly forge would make explicit: pointer-and-length slices, arenas, capacity limits, calling conventions, and ownership. It contains no public gy source or implementation claim; the public Git upstream link supplies only the format and behavior context for the thought experiment.",
        "The constraint is educational as well as technical. Parser bounds, integer widths, calling conventions, and error returns become part of the review surface, so a convenience that would be one opaque library call elsewhere must be justified as a concrete sequence of state changes.",
      ),
      section(
        "Narrow exposure while the foundation moves",
        "A deliberately narrow teaching prototype might use assembly and static assets, preserve explicit lengths, and avoid public network exposure. Those choices can reduce uncontrolled interfaces while object handling and transport assumptions are explored, but they remain hypothetical here rather than reported project state.",
        "Loopback is not a production security story. A hypothetical forge should reserve public exposure until transport, identity, isolation, audit, legal, deployment, canary, and incident gates exist, rather than treating any listening prototype as a service.",
      ),
      section(
        "Call the experiment what it is",
        "A forge thought experiment should not be confused with Git or GitHub parity. The honest subject is the engineering method: what low-level constraints reveal, what public Git behavior supplies as a reference, and which production, security, and operational claims remain entirely unmade.",
        "No public gy project source is claimed or linked here. The public Git upstream link supplies context for file formats and behaviors, while the essay remains original analysis rather than an invitation to inspect or reuse a project implementation.",
      ),
    ],
  },
  {
    slug: "reproducible-builds-evidence-contract",
    title: "A reproducible build is an evidence contract",
    excerpt:
      "Pinned tools, an exact clean commit, isolated directories, deterministic inputs, byte comparison, and manifest review turn repetition into evidence.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Operations",
    tags: ["reproducibility", "release evidence", "toolchains"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "release-bars",
      alt: "Two independently built pixel bars align byte for byte at a release gate.",
    },
    project: "gy",
    sourceLinks: [REPRODUCIBLE_BUILDS_SOURCE, SLSA_SOURCE],
    relatedSlugs: [
      "assembly-makes-assumptions-visible",
      "wrong-host-is-not-a-pass",
      "complete-backup-needs-objects",
    ],
    body: [
      section(
        "Repeat the conditions, not just the command",
        "Two invocations in one dirty directory can reproduce the same accidental cache. The public Reproducible Builds definition instead motivates fixed source, build environment, instructions, specified artifacts, and byte comparison. This gy-labeled essay applies that public concept as original analysis and makes no project-result claim.",
        "Each condition closes a different escape hatch. Exact source identity rules out unnoticed edits, isolated directories reduce shared-state influence, and pinned tools prevent a compiler or linker update from being misreported as a source-determined difference.",
      ),
      section(
        "Compare the manifests around the binary",
        "Matching executable bytes are powerful evidence, but release review also needs to know what was included and how it was assembled. Binary manifests, tool identities, and the commands that produced them let another reviewer connect the comparison to a specific candidate rather than to a vague development state.",
        "This is why a developer cross-build and a native acceptance run are different records. One can provide rapid feedback from a convenient host while the other proves the candidate under the operating system and architecture that define delivery.",
      ),
      section(
        "Avoid converting a method into a result",
        "A documented reproducibility procedure does not mean any current project head has passed it. This account describes an evidence contract without announcing a gy release, candidate result, or production acceptance, none of which is claimed by a public source here.",
        "That restraint is part of reproducibility culture. Evidence is useful only when its subject, environment, and time are exact; a green result from another candidate should remain attached to that candidate instead of becoming a permanent adjective for the project.",
      ),
    ],
  },
  {
    slug: "parse-completely-publish-once",
    title: "Parse completely, then publish output once",
    excerpt:
      "Caller-visible state should remain unchanged until a bounded Git object or integrity check has validated the complete input.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Research",
    tags: ["parser safety", "Git objects", "transactional output"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "record-lattice",
      alt: "A malformed pixel stream is rejected before reaching a clean output lattice.",
    },
    project: "gy",
    sourceLinks: [
      {
        label: "Git mktag documentation",
        href: "https://git-scm.com/docs/git-mktag/2.43.0/",
      },
      {
        label: "Git fsck documentation",
        href: "https://git-scm.com/docs/git-fsck/2.55.0/",
      },
    ],
    relatedSlugs: [
      "assembly-makes-assumptions-visible",
      "envelope-encryption-as-protocol",
      "preview-before-mutation",
    ],
    body: [
      section(
        "Keep partial truth private",
        "A parser often learns useful facts before it discovers a malformed suffix. If it writes those facts directly into caller-owned outputs, failure leaves a mixture of old state and partial new state that every caller must remember to unwind correctly.",
        "A bounded parser can use a cleaner contract: parse into temporary state, validate the full identity and structure, and leave caller-visible output unchanged unless the complete operation succeeds. This is original gy-labeled analysis grounded in public Git formats, not a statement about a public gy implementation.",
      ),
      section(
        "Apply the pattern across object types",
        "Strict identities, commit and tag grammar, raw tree parsing, and integrity traversal differ in format, but they can share the same publication discipline. Fixed capacities and explicit lengths make the point at which an input becomes unacceptable part of the API rather than an implementation accident.",
        "Focused vectors test accepted and rejected shapes, while differential comparisons can reveal disagreements with established Git behavior. Neither proves complete compatibility, but together they protect the bounded foundation from regressions that a happy-path parser test would miss.",
      ),
      section(
        "Foundations are not complete commands",
        "Object parsing and a small integrity walk do not amount to a full Git implementation or complete repository checker. The public Git manuals describe broader commands; this article uses them as technical context and does not claim that gy implements any particular subset.",
        "The reusable design rule remains valuable at the smaller scope. When parsing can fail late, collect candidate results privately and commit them once; callers then receive either a verified answer or the exact state they had before the attempt.",
      ),
    ],
  },
  {
    slug: "wrong-host-is-not-a-pass",
    title: "The wrong host is not a passing release gate",
    excerpt:
      "A skipped native runtime check is not acceptance, and source presence is not evidence that a candidate was delivered on its target system.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Operations",
    tags: ["release gates", "native acceptance", "fail closed"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "archive-lines",
      alt: "A release path stops cleanly at a mismatched host architecture marker.",
    },
    project: "gy",
    sourceLinks: [SLSA_SOURCE],
    relatedSlugs: [
      "reproducible-builds-evidence-contract",
      "completion-is-a-proof-obligation",
      "complete-backup-needs-objects",
    ],
    body: [
      section(
        "Distinguish build convenience from acceptance",
        "A developer can cross-build an x86-64 Linux artifact from another host and gain useful compile-time feedback. That does not exercise the runtime, syscall, loader, and environment assumptions of the target, so this original gy-labeled analysis keeps cross-build evidence separate from native acceptance without claiming any gy result.",
        "The native gate fails on the wrong operating system or architecture instead of reporting a skip that might be read as green. This converts an environmental precondition into an enforceable part of the release contract.",
      ),
      section(
        "Attach proof to an exact candidate",
        "A feature visible in the source tree is not proof that the candidate containing it passed the delivery profile. Acceptance belongs to an exact source identity and produced artifact, with the environment and result retained together rather than summarized as a permanent project status.",
        "The distinction prevents a common release error: carrying an older successful run forward after source changes. New work can reuse the procedure and infrastructure, but it must earn new evidence under the same target conditions.",
      ),
      section(
        "Keep public exposure behind named gates",
        "Even a native pass would not settle transport security, identity, repository isolation, audit, legal review, deployment behavior, canary operation, or incident response. Those remain separate hypothetical gates, and this article does not claim that gy has defined or passed them.",
        "This article therefore makes no current release claim. It records a fail-closed gate design and the broader principle that unavailable evidence must remain unavailable, not be translated into success because the rest of a pipeline completed.",
      ),
    ],
  },
  {
    slug: "one-budget-equation-every-backend",
    title: "One budget equation for every model backend",
    excerpt:
      "A conservative input, output, and safety-margin invariant keeps local and remote routes inside one inspectable context policy.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "AI Systems",
    tags: ["token budgets", "backend policy", "context reduction"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "context-rings",
      alt: "Several noisy context rings compress inside one fixed pixel budget.",
    },
    project: "Local Harness",
    sourceLinks: [CODEX_CLI_SOURCE],
    relatedSlugs: [
      "repository-context-is-capability",
      "no-silent-local-to-remote",
      "concurrency-without-grandchildren",
    ],
    body: [
      section(
        "Put the policy before backend selection",
        "This original Local Harness-labeled analysis proposes one conservative input, output, and safety-margin equation before selecting a backend. The exact budget belongs to each deployment; no public Local Harness source or implementation is claimed. The useful design question is whether every route is judged by one inspectable policy rather than provider-specific improvisation.",
        "A chosen number would be a product policy, not a statement about every model's maximum capacity. Its value comes from being conservative and consistently applied: every request can be reviewed against the same equation regardless of which implementation eventually receives it.",
      ),
      section(
        "Reduction is part of the request contract",
        "Budget enforcement after a request reaches an adapter is too late to provide consistent semantics. A hypothetical host can normalize and reduce first, making history selection, repository context, user input, reserved output, and error behavior visible in one place.",
        "Exactly one selected backend then receives an already-approved request. Bridges translate protocols and streaming events, but they do not silently expand the prompt, invent retry context, or decide that a different privacy route would be more convenient.",
      ),
      section(
        "Measure the conservative edge",
        "A useful test suite targets the boundary where another byte or token estimate would exceed the invariant. It should prove both that the accepted request stays inside the equation and that rejection or reduction occurs before any backend-side effect.",
        "This makes context budgeting a deterministic systems property rather than a model suggestion. The model can reason over the approved material, but it cannot negotiate for an unbounded transcript or redefine the safety margin from inside its own response.",
      ),
    ],
  },
  {
    slug: "repository-context-is-capability",
    title: "Repository context is an explicit capability",
    excerpt:
      "A path typed into chat should not grant source access; selection requires explicit opt-in, canonical containment, tracked discovery, and bounded reads.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Security",
    tags: ["repository access", "capabilities", "path safety"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "local-orbit",
      alt: "A selected repository node sits inside several containment rings.",
    },
    project: "Local Harness",
    sourceLinks: [GIT_LS_FILES_SOURCE, NIST_ZERO_TRUST_SOURCE],
    relatedSlugs: [
      "one-budget-equation-every-backend",
      "deterministic-container-lifecycle",
      "file-link-is-not-authorization",
    ],
    body: [
      section(
        "Selection must be deliberate",
        "This original Local Harness-labeled analysis does not treat a filesystem-looking string in conversation as permission to inspect a repository. It proposes an explicit selection capability and transactional failure while making no claim that a public Local Harness implementation currently provides either behavior.",
        "This separates user intent from model interpretation. The model may discuss a path as text, but only deterministic host code can turn an approved selection into the bounded repository context available for a later request.",
      ),
      section(
        "Contain every discovered file",
        "The context pipeline canonicalizes containment, anchors discovery to descriptors, limits eligible files to tracked material, and bounds reads. Symlinks, hardlinks, traversal, and helper-process behavior are treated as security concerns rather than delegated to a prompt that asks the model to be careful.",
        "Tracked-file discovery is a useful narrowing rule, not permission to expose an entire checkout. Eligibility still passes through size, type, containment, and budget checks before a snippet can enter the approved context.",
      ),
      section(
        "Keep private evidence out of public examples",
        "A screenshot of a successful context request can accidentally reveal filenames, selected snippets, account paths, or terminal history. Public demonstrations should use a synthetic repository whose names and contents were created for disclosure rather than redacting a real working session after capture.",
        "The capability model helps here too: a demo can show the exact opt-in and bounded discovery sequence without needing to reveal any private source. The lesson is in the transition from no access to scoped access, not in the value of the selected material.",
      ),
    ],
  },
  {
    slug: "no-silent-local-to-remote",
    title: "Never fail over from local to remote in silence",
    excerpt:
      "Backend selection carries privacy semantics, so local inference failure must return an error instead of exporting the same prompt elsewhere.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Security",
    tags: ["privacy", "backend selection", "failover"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "split-horizon",
      alt: "Local and remote dither fields remain separated when the local route stops.",
    },
    project: "Local Harness",
    sourceLinks: [NIST_ZERO_TRUST_SOURCE],
    relatedSlugs: [
      "one-budget-equation-every-backend",
      "drafts-without-publication-authority",
      "save-is-not-run",
    ],
    body: [
      section(
        "A backend name is a data decision",
        "Choosing an on-device model or a remote API is not merely a latency preference. It decides which process receives the prompt and which retention, residency, and provider policies may apply. This original Local Harness-labeled analysis therefore treats the selected route as approved request state, without claiming a public implementation.",
        "When the local route fails, sending the same material to a remote provider would change that decision after approval. The harness returns an error instead, leaving the user free to choose a remote retry explicitly with full knowledge that the boundary has changed.",
      ),
      section(
        "Keep bridges mechanically narrow",
        "A hypothetical host can own normalization, budgeting, history, backend choice, timeout behavior, and audit semantics. Narrow adapters then receive one already-approved local or remote request and cannot reinterpret an error as permission to cross routes. This is an original boundary proposal, not reported project architecture.",
        "This architecture reduces the number of places where privacy policy can drift. Provider adapters still need careful implementation, but their contract is translation and transport rather than a second, hidden policy engine.",
      ),
      section(
        "Do not imply equivalent provider guarantees",
        "A local route and a remote route can share request shapes without sharing data-handling guarantees. Provider retention and residency depend on the actual deployment and contracts, so a general article should not claim that selecting either backend has identical privacy consequences.",
        "Explicit failure is therefore a usability feature as well as a safeguard. The error tells the operator that the chosen boundary could not complete, while silent fallback would produce a smoother interface at the cost of invalidating the user's original decision.",
      ),
    ],
  },
  {
    slug: "deterministic-container-lifecycle",
    title: "A container lifecycle that never calls a model",
    excerpt:
      "Natural-language-like commands can map to a strict plan, fixed argument vectors, typed limits, cancellation, and ownership-proven cleanup.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Build",
    tags: ["containers", "deterministic tools", "lifecycle"],
    readingTime: 0,
    placement: "recent",
    visual: {
      variant: "plan-stack",
      alt: "A typed pixel plan moves through create, verify, and cleanup stages.",
    },
    project: "Local Harness",
    sourceLinks: [APPLE_CONTAINER_SOURCE, CODEX_CLI_SOURCE],
    relatedSlugs: [
      "repository-context-is-capability",
      "two-sockets-two-authorities",
      "completion-is-a-proof-obligation",
    ],
    body: [
      section(
        "Translate syntax into a typed plan",
        "This original Local Harness-labeled analysis asks how a container command could avoid model invocation entirely. A compact command language can parse into a deterministic plan whose resources, bounds, and fixed argument vectors are reviewable and testable. It makes no public Local Harness implementation claim.",
        "This makes each lifecycle stage inspectable. Provisioning, verification, cancellation, and cleanup are code paths with typed limits rather than prose instructions that an agent may reinterpret differently from one run to the next.",
      ),
      section(
        "Clean up only what the run can prove it owns",
        "Cancellation is not permission to delete every similarly named resource. Conservative cleanup uses ownership evidence from the active plan and refuses broad guesses, preserving unrelated machines or containers even when an interrupted run leaves partial state.",
        "The same principle applies to command construction. Fixed argument arrays avoid a shell interpolation boundary, while validation rejects out-of-range values before an external tool sees them.",
      ),
      section(
        "Name the host-sharing caveat",
        "Any plan that shares writable host files into a guest has a material boundary and must not be marketed as host isolation merely because execution happens inside a virtualized environment. Mount authority needs to be stated and tested for the concrete configuration rather than inferred from the word container.",
        "The public Apple and Codex documentation linked here provides context for the surrounding tools. It does not certify the private harness or erase its documented sharing caveat; the useful claim is narrower, that lifecycle planning itself remains deterministic and model-free.",
      ),
    ],
  },
  {
    slug: "control-plane-you-can-read",
    title: "An agent control plane you can read",
    excerpt:
      "One strict TOML manifest makes roles, limits, workspace selection, and escalation policy reviewable without turning generated state into configuration.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Tools",
    tags: ["TOML", "agent orchestration", "configuration"],
    readingTime: 0,
    placement: "stories",
    visual: {
      variant: "shared-notebook",
      alt: "Multiple agent paths converge on one small readable manifest.",
    },
    project: "TOML Agent",
    sourceLinks: [TOML_SPEC_SOURCE],
    relatedSlugs: [
      "save-is-not-run",
      "two-sockets-two-authorities",
      "writing-from-verifiable-boundaries",
    ],
    body: [
      section(
        "Make one file the human contract",
        "This original TOML Agent-labeled lab analysis asks how one strict manifest could describe a multi-agent team in a diffable form while generated roles, semantic revisions, runtime mappings, preferences, and caches remain generated state. It claims no public TOML Agent source or implementation; the TOML specification supports only the file-format discussion.",
        "That separation keeps configuration portable without pretending that every runtime fact belongs in version control. A teammate can inspect the declared team without inheriting stale thread identifiers or machine-specific caches from another operator.",
      ),
      section(
        "Reject ambiguity at the boundary",
        "Unknown schema fields and unsafe escalation settings fail validation. A misspelled key therefore cannot be ignored while the application continues with a default that looks plausible but grants a different authority than the author intended.",
        "Strictness also makes evolution deliberate. A new field needs a defined meaning, validation, and consumer behavior before it becomes accepted syntax, preventing the manifest from growing into a bag of hints that each interface interprets independently.",
      ),
      section(
        "Keep the interface hierarchy explicit",
        "A design should declare which interface is authoritative and which experiments remain references. That status distinction prevents parallel prototypes from becoming accidental product promises, but this essay does not identify or claim any TOML Agent implementation surface.",
        "The article describes a hypothetical configuration model only. It does not call TOML Agent published, open source, released, or available for readers to install, and it provides no project-source backlink.",
      ),
    ],
  },
  {
    slug: "save-is-not-run",
    title: "Save is not Run",
    excerpt:
      "Configuration reconciliation may update idle thread definitions, but it must never dispatch a prompt or rewrite the revision of an active turn.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Product",
    tags: ["configuration", "revision pinning", "explicit actions"],
    readingTime: 0,
    placement: "stories",
    visual: {
      variant: "handoff-map",
      alt: "A saved manifest path stops before a separate run trigger.",
    },
    project: "TOML Agent",
    sourceLinks: [TOML_SPEC_SOURCE, JSON_RPC_SOURCE],
    relatedSlugs: [
      "control-plane-you-can-read",
      "drafts-without-publication-authority",
      "preview-before-mutation",
    ],
    body: [
      section(
        "Separate configuration from execution",
        "A Save button should mean that validated configuration reached durable storage. This original TOML Agent-labeled analysis proposes that saving never implies permission to send a model prompt or begin a turn. It is a design argument, not a claim about a public implementation.",
        "This avoids a dangerous user-interface shortcut. Editing a role, limit, or model setting is reviewable preparation; dispatching work can consume quota, access tools, and request approvals, so it deserves its own explicit action and observable result.",
      ),
      section(
        "Pin active turns to their starting revision",
        "In the proposed model, an active turn continues under the semantic revision with which it began. A later save can prepare the next idle configuration, but it does not alter the contract halfway through a running exchange or make past events appear to have used new settings.",
        "Revision pinning improves incident review and reproducibility. When behavior is questioned, the controller can identify the exact configuration that governed the turn instead of reconstructing it from the manifest's latest contents.",
      ),
      section(
        "Resolve concurrent edits visibly",
        "Atomic replacement and expected content hashes detect when the file changed after an editor loaded it. Compare, Reload, and Keep choices make the conflict a user decision rather than silently overwriting another valid edit or merging text without understanding its semantic effect.",
        "Together, these rules make the manifest a live control file without making it magical. Save has a bounded storage meaning, Run has a bounded execution meaning, and active work retains the immutable configuration identity needed to explain what happened.",
      ),
    ],
  },
  {
    slug: "two-sockets-two-authorities",
    title: "Two local sockets, two distinct authorities",
    excerpt:
      "A hypothetical local control plane can separate controller state from canonical conversation state without claiming a public TOML Agent architecture.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Architecture",
    tags: ["Unix sockets", "JSON-RPC", "authority boundaries"],
    readingTime: 0,
    placement: "stories",
    visual: {
      variant: "contract-bridge",
      alt: "Two separate local socket lines connect without merging their authority.",
    },
    project: "TOML Agent",
    sourceLinks: [JSON_RPC_SOURCE],
    relatedSlugs: [
      "control-plane-you-can-read",
      "deterministic-container-lifecycle",
      "concurrency-without-grandchildren",
    ],
    body: [
      section(
        "Do not collapse state ownership",
        "This original TOML Agent-labeled analysis considers two hypothetical local Unix-domain sockets: one for controller state and another for canonical conversation state. The separation illustrates authority boundaries but makes no claim about a public TOML Agent architecture or deployed service.",
        "Separate channels make that ownership visible in the architecture. A user interface can request controller operations without gaining the ability to redefine canonical conversation history, and the controller can reference Codex threads without importing credentials or full prompts into its own storage.",
      ),
      section(
        "Bound the wire format",
        "A controller protocol can use framed JSON-RPC 2.0, explicit application-version negotiation, a documented message limit, generated consumer bindings, and idempotent event reduction. The public JSON-RPC specification defines request and response semantics; framing, size, and event rules remain hypothetical design choices here.",
        "A size limit is important even on a local channel. It protects parsers and queues from treating proximity as trust, while version negotiation lets an incompatible client fail clearly before it begins applying events under the wrong contract.",
      ),
      section(
        "Local does not mean ambient",
        "A hypothetical local-socket design should use owner-private modes and avoid adding a network listener unless one is explicitly required and secured. Local transport still does not justify copying authentication files, prompts, command output, or workspace contents into diagnostics by default.",
        "A safe diagnostic design can redact credential-shaped values and omit sensitive categories unless explicitly included. The architectural lesson is general: a local control plane still needs least authority, bounded messages, and disclosure-aware operational tooling.",
      ),
    ],
  },
  {
    slug: "concurrency-without-grandchildren",
    title: "Compile agent concurrency without grandchildren",
    excerpt:
      "A flat-team design can count the lead inside its cap, prevent recursive delegation, and refuse incompatible model metadata without silent substitution.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "AI Systems",
    tags: ["concurrency", "multi-agent systems", "fail closed"],
    readingTime: 0,
    placement: "stories",
    visual: {
      variant: "event-river",
      alt: "One root agent branches into bounded peers with no second-level branches.",
    },
    project: "TOML Agent",
    sourceLinks: [CODEX_CLI_SOURCE],
    relatedSlugs: [
      "two-sockets-two-authorities",
      "one-budget-equation-every-backend",
      "completion-is-a-proof-obligation",
    ],
    body: [
      section(
        "Count the coordinator",
        "A concurrency cap is misleading if it counts only delegated workers and treats the lead as free. This original TOML Agent-labeled analysis proposes counting the coordinator and workers together, without claiming a public TOML Agent implementation or runtime result.",
        "This matters for quota, tool contention, and human review. A team described as four agents should not become five active model turns because the coordinator was hidden outside the arithmetic.",
      ),
      section(
        "Prevent recursive expansion structurally",
        "One hypothetical flat-team design can prevent recursive delegation by giving worker roles no child capacity. Enforcing the limit in controller configuration is stronger than leaving it as prose that a delegated model might misunderstand or ignore, but the exact mechanism depends on the public runtime contract being used.",
        "A flat team is easier to observe and stop. The lead can account for every worker directly, while approval requests and failures do not disappear into an unbounded delegation tree whose ownership is difficult to reconstruct.",
      ),
      section(
        "Refuse silent model substitution",
        "Unknown or incompatible model metadata fails closed. Replacing a requested model with a convenient alternative would change capability, cost, and behavior without updating the manifest that operators reviewed.",
        "The same explicitness applies to approvals: accessible terminal output presents numbered choices with no default and does not convert a timeout into consent. Deterministic limits and explicit decisions keep orchestration authority outside the model's prose.",
      ),
    ],
  },
  {
    slug: "four-nouns-for-live-workbooks",
    title: "Four nouns for spreadsheet-backed software",
    excerpt:
      "Field, Record, Template, and Current separate schema, business data, guidance, and the immutable workbook version users may trust.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Product Systems",
    tags: ["dynamic modules", "workbooks", "data vocabulary"],
    readingTime: 0,
    placement: "research",
    visual: {
      variant: "record-lattice",
      alt: "Four distinct pixel layers align into one workbook system.",
    },
    project: "Cumulus Platform",
    sourceLinks: [PLATFORM_SOURCE, JSON_SCHEMA_SOURCE],
    relatedSlugs: [
      "preview-before-mutation",
      "file-link-is-not-authorization",
      "complete-backup-needs-objects",
    ],
    body: [
      section(
        "Give each kind of truth a name",
        "This original Cumulus Platform-labeled analysis proposes four precise nouns. A Field describes one schema element, a Record carries business data, a Template offers guidance, and Current names an authoritative immutable version. It does not claim that the live product or a public source implements this model; JSON Schema is linked only for general schema context.",
        "The vocabulary prevents a common spreadsheet ambiguity. A file downloaded last week may resemble current schema and data, but resemblance is not authority; the proposed model can identify exactly which immutable version is designated Current.",
      ),
      section(
        "Keep guidance separate from live data",
        "A Template helps an operator prepare an import without becoming the live register. It can express fields and controlled-list choices while remaining distinct from Current, whose integrity and selected version represent the private operational state.",
        "That separation allows guidance to evolve without silently rewriting business records. It also makes support conversations clearer: a question can refer to the template format, an individual record, or the selected current workbook without treating all three as one mutable spreadsheet.",
      ),
      section(
        "Stop when authority is inconsistent",
        "In the proposed synthetic model, a Current workbook is private, immutable, and checksummed. If its pointer or integrity metadata is inconsistent, the download path stops instead of generating a convenient fallback. This is an analysis pattern rather than a live-product claim.",
        "This would be a product decision as much as a storage decision. Refusing an ambiguous download protects the user's mental model: Current means the version the hypothetical system can prove, not whichever workbook can be reconstructed under pressure.",
      ),
    ],
  },
  {
    slug: "preview-before-mutation",
    title: "Preview before mutation",
    excerpt:
      "Merge and destructive Replace should depend on a short-lived approval bound to the exact file, mode, schema, register, and dependencies reviewed.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Product Systems",
    tags: ["preview", "approval receipts", "imports"],
    readingTime: 0,
    placement: "research",
    visual: {
      variant: "plan-stack",
      alt: "A read-only dither preview sits above a separately approved mutation layer.",
    },
    project: "Cumulus Platform",
    sourceLinks: [PLATFORM_SOURCE, RFC_HTTP_SOURCE],
    relatedSlugs: [
      "four-nouns-for-live-workbooks",
      "parse-completely-publish-once",
      "save-is-not-run",
    ],
    body: [
      section(
        "Make Preview read-only",
        "In a synthetic import workflow, upload begins with a Preview that calculates proposed effects without changing the register. The operator can inspect validation, additions, updates, and destructive consequences before the hypothetical system asks for permission to apply anything.",
        "Read-only preview is stronger than a confirmation dialog built from client guesses. It lets server-side validation describe the exact candidate under the same schema and dependency rules that will govern the later mutation.",
      ),
      section(
        "Bind consent to the reviewed candidate",
        "An approval becomes stale when the file, mode, schema, register, or dependency state changes. This original platform-labeled analysis proposes invalidating that consent instead of carrying it onto another candidate. It makes no claim about the live product's implementation; RFC 9110 supplies public context for conditional requests.",
        "This turns approval into a content-bound receipt. The Apply step can prove that it is executing the candidate the operator saw, and a conflict requires a fresh preview instead of quietly recalculating after the decision.",
      ),
      section(
        "Name Merge and Replace honestly",
        "Merge preserves omitted records, while Replace removes them and requires an exact confirmation. The difference is not a hidden import option: it changes the deletion semantics of the operation and therefore appears in both preview evidence and explicit consent.",
        "Revision-aware mutations reinforce the same boundary. A stale result asks the operator to reload and deliberately retry rather than replaying an old payload into a register whose schema or data may already have moved forward.",
      ),
    ],
  },
  {
    slug: "file-link-is-not-authorization",
    title: "A file link is not authorization",
    excerpt:
      "Record visibility and private-document download permission need separate access checks, authenticated tenant context, and server-mediated delivery.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Security",
    tags: ["file access", "tenant isolation", "server routes"],
    readingTime: 0,
    placement: "research",
    visual: {
      variant: "key-vault",
      alt: "A visible record marker remains separated from a protected file object.",
    },
    project: "Cumulus Platform",
    sourceLinks: [PLATFORM_SOURCE, NIST_ABAC_SOURCE],
    relatedSlugs: [
      "four-nouns-for-live-workbooks",
      "three-boundaries-one-workflow",
      "repository-context-is-capability",
    ],
    body: [
      section(
        "Separate entity visibility from file permission",
        "A user may be allowed to see that a record exists without being allowed to download every attached document. This original platform-labeled analysis treats those decisions separately so a broad list view does not become an implicit grant. It does not claim that the live product implements this model; NIST ABAC supplies general authorization context.",
        "The distinction supports more precise roles and relationships. Each access path can ask whether the authenticated actor belongs to the correct tenant and has the relevant relationship for this file, rather than relying on the fact that the browser already rendered a surrounding card.",
      ),
      section(
        "Derive scope from the session",
        "A hypothetical portal route should derive tenant and relationship boundaries from authenticated session state. It should not accept an arbitrary tenant identifier as sufficient proof or expose a storage credential that lets the browser bypass application policy.",
        "File delivery flows through server routes that can enforce the grant at request time. A copied link therefore does not become durable authority for another account, and storage topology remains behind the application boundary.",
      ),
      section(
        "Debug from safe evidence first",
        "When a download fails, trace identifiers and safe error codes can establish which boundary rejected the request without placing customer content, object keys, or raw storage URLs in logs and screenshots. Content access should remain a minimized, explicitly justified escalation.",
        "This approach matters during incidents as well as normal support. Cross-organization disclosure is treated as high severity, so diagnostic convenience cannot override the same tenant isolation that governs the product path.",
      ),
    ],
  },
  {
    slug: "complete-backup-needs-objects",
    title: "A database snapshot is not a complete backup",
    excerpt:
      "Recovery must pair database and object assets, restore into isolation, and compare checksums and authoritative pointers before any production decision.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Operations",
    tags: ["backups", "object storage", "recovery drills"],
    readingTime: 0,
    placement: "research",
    visual: {
      variant: "archive-lines",
      alt: "Database rows and object blocks reunite inside an isolated recovery frame.",
    },
    project: "Cumulus Platform",
    sourceLinks: [PLATFORM_SOURCE, NIST_CONTINGENCY_SOURCE],
    relatedSlugs: [
      "four-nouns-for-live-workbooks",
      "reproducible-builds-evidence-contract",
      "wrong-host-is-not-a-pass",
    ],
    body: [
      section(
        "Inventory two recovery assets",
        "A database can preserve metadata, revisions, grants, and pointers while referenced files live in object storage. This original platform-labeled analysis treats database and object backups as separate assets for a complete recovery story. It does not claim a live product architecture or recovery result; NIST contingency guidance supplies the public planning context.",
        "The separation prevents a successful database job from becoming a misleading green backup status. An inventory can report the age and integrity of each asset and make the gap visible when one side of the product state is missing.",
      ),
      section(
        "Restore away from the live target",
        "A recommended recovery drill restores into an isolated target rather than overwriting production to prove an archive is readable. It can inspect schema state, selected pointers, object presence, and checksums without turning verification into an incident.",
        "Isolation also makes destructive assumptions testable. If a procedure depends on an order of operations or a provider feature, the team discovers that dependency in the drill rather than while trying to recover a live tenant.",
      ),
      section(
        "Keep recovery evidence scoped",
        "A passed drill supports a defined recovery point and procedure; it does not prove every future archive or guarantee an unmeasured recovery time. Honest readiness records distinguish deterministic checks from manual provider, environment-separation, and operational evidence.",
        "Application promotion and data migration should remain separate explicit changes. A verified backup can be a prerequisite for risky migration, but never permission to deploy code or mutate production without exact-target confirmation.",
      ),
    ],
  },
  {
    slug: "writing-from-verifiable-boundaries",
    title: "Write from verifiable boundaries",
    excerpt:
      "A project log becomes more trustworthy when original analysis, public primary sources, release status, and operational proof remain separate claims.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Studio Process",
    tags: ["evidence", "technical writing", "scope"],
    readingTime: 0,
    placement: "research",
    visual: {
      variant: "paper-field",
      alt: "A noisy research field resolves into three clearly labeled evidence bands.",
    },
    project: "Cumulus lab",
    sourceLinks: [GITHUB_VISIBILITY_SOURCE, PUBLIC_REPOSITORIES_SOURCE],
    relatedSlugs: [
      "backlinks-that-do-not-pretend",
      "dither-as-editorial-grammar",
      "trust-root-before-product-surface",
    ],
    body: [
      section(
        "Separate local truth from public proof",
        "A local checkout can establish what its documentation and implementation currently say. It cannot establish that an anonymous reader can reach the repository, that the same commit is deployed, or that a production environment passed the gates described in those files.",
        "Cumulus keeps those evidence classes separate in its project writing. Nonpublic observations may select a general topic but cannot support a public technical claim; public primary sources support backlinks, while release or operational claims require their own current reproducible evidence.",
      ),
      section(
        "Use absences as editorial constraints",
        "When a repository is not publicly accessible or has no verified license, the article should not reproduce code, promise source availability, or call the project open source. That absence does not prevent original commentary, but it changes what the page may offer readers as evidence.",
        "The same rule applies to screenshots and logs. A compelling image is not worth publishing if its value depends on private paths, participants, provider identifiers, or operational records that were never cleared for a public site.",
      ),
      section(
        "Attach every adjective to a testable subject",
        "Words such as production-ready, secure, released, and deployed compress many independent conditions. A stronger log names the exact component, candidate, environment, and check, then stops where the evidence stops.",
        "This style can sound less dramatic, but it gives future updates somewhere precise to land. When a repository becomes public or a deployment gate passes, the article can add that new fact without rewriting an inflated narrative that was never supported.",
      ),
    ],
  },
  {
    slug: "backlinks-that-do-not-pretend",
    title: "Backlinks that do not pretend",
    excerpt:
      "When source repositories are private, internal related logs and verified upstream references serve readers better than links that resolve to a 404.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Publishing",
    tags: ["backlinks", "GitHub", "public evidence"],
    readingTime: 0,
    placement: "build-business",
    visual: {
      variant: "contract-bridge",
      alt: "Verified link paths remain bright while unavailable routes stop before the edge.",
    },
    project: "Cumulus lab",
    sourceLinks: [GITHUB_VISIBILITY_SOURCE],
    relatedSlugs: [
      "writing-from-verifiable-boundaries",
      "completion-is-a-proof-obligation",
      "assembly-makes-assumptions-visible",
    ],
    body: [
      section(
        "A familiar URL can still be false evidence",
        "A configured development remote does not prove that a matching URL is available to a site visitor. GitHub documents public and private repository visibility as different access states, so a publication should verify anonymous reachability and licensing before presenting any repository as reader-accessible evidence.",
        "Cumulus omits those project URLs rather than decorating them with a vague private label. If a repository later becomes public, visibility and licensing should be checked again at publication time before the source backlink is added.",
      ),
      section(
        "Build the graph inside the publication",
        "Every published log can still link to adjacent essays that explain another layer of the same system. These internal backlinks help readers move from trust roots to encryption, from parser publication to import previews, or from context capability to file authorization without exposing private source.",
        "An internal link is useful only when it resolves to a published page. Drafts stay outside the public selector, and the content validator checks every related slug so an editorial rename cannot leave a quiet dead end.",
      ),
      section(
        "Use upstream links for upstream concepts",
        "Public Git documentation, Apple's container documentation, and the Codex CLI guide can support general context where those upstream systems are discussed. They do not become proof that a private derivative project implements every documented behavior.",
        "The creator profile and verified public-repositories index establish author identity and discoverable public work. Their labels say exactly that, avoiding the stronger and unsupported claim that they contain the private implementation behind each essay.",
      ),
    ],
  },
  {
    slug: "dither-as-editorial-grammar",
    title: "Dither as an editorial grammar",
    excerpt:
      "Pixel density, interruption, and open black space can express hierarchy across a large homepage and long-form logs without becoming decorative noise.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Design",
    tags: ["dither", "editorial design", "accessibility"],
    readingTime: 0,
    placement: "build-business",
    visual: {
      variant: "workspace-beacon",
      alt: "A wide black field uses dither density to mark headline, article, and footer zones.",
    },
    project: "Cumulus lab",
    sourceLinks: [W3C_MOTION_SOURCE],
    relatedSlugs: [
      "writing-from-verifiable-boundaries",
      "backlinks-that-do-not-pretend",
      "deterministic-container-lifecycle",
    ],
    body: [
      section(
        "Give texture a structural job",
        "A dither field can establish scale, divide a transition, or give a project family a stable visual rhythm. It is less useful when every surface receives equal noise, because uniform decoration erases the hierarchy that a large editorial page needs.",
        "Cumulus assigns named visual variants to posts and lets density change with placement. The title and metadata remain ordinary text, so the pattern reinforces a story's role without becoming the only place where meaning is encoded.",
      ),
      section(
        "Design the static state first",
        "Each visual carries concise alternative text and the article remains complete when the shader is unavailable. Reduced-motion preferences stop animation, while a static dither fallback preserves the black, gray, and orange composition without requiring a graphics-capable device.",
        "This baseline also improves performance decisions. Decorative rendering can pause outside the viewport and use a bounded pixel budget because the reading experience does not depend on a continuously running effect.",
      ),
      section(
        "Let repetition become identity",
        "The homepage hero, project graph, article plates, separators, and footer can share the same limited visual language while varying shape and intensity. Repetition makes the brand recognizable; controlled variation keeps a long page from feeling like one copied component.",
        "The result is deliberately spare in color. Pure black carries the field, gray text establishes reading hierarchy, and a small orange accent marks action or state rather than filling large decorative regions.",
      ),
    ],
  },
  {
    slug: "completion-is-a-proof-obligation",
    title: "Completion is a proof obligation",
    excerpt:
      "A finished implementation maps every requested behavior to current code, tests, rendered evidence, or an explicit external gate before it claims success.",
    status: "published",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Studio Process",
    tags: ["verification", "release gates", "definition of done"],
    readingTime: 0,
    placement: "build-business",
    visual: {
      variant: "release-bars",
      alt: "Many independent evidence bars meet one final completion boundary.",
    },
    project: "Cumulus lab",
    sourceLinks: [SLSA_SOURCE],
    relatedSlugs: [
      "writing-from-verifiable-boundaries",
      "backlinks-that-do-not-pretend",
      "wrong-host-is-not-a-pass",
    ],
    body: [
      section(
        "Turn the request into evidence rows",
        "A broad build request contains different kinds of requirements: visual structure, content count, navigation, authentication, delivery behavior, responsive states, public safety, and production wiring. One passing build cannot prove all of them, so completion begins by naming the authoritative evidence for each row.",
        "Code inspection can prove a route exists, focused tests can protect deterministic rules, browser captures can reveal layout defects, and provider dashboards can prove external configuration. Each form of evidence answers a narrower question and should not be stretched to cover the rest.",
      ),
      section(
        "Treat skipped and unavailable checks honestly",
        "A skipped check is neither a failure nor a pass; it is missing evidence. If a production credential, DNS record, or target runtime is unavailable, local work may still be ready, but the broader claim remains open until the external state is observed.",
        "Fail-closed tooling helps preserve that distinction. It records the unmet gate and stops publication rather than creating an artifact whose polish invites someone to assume that every required environment was verified.",
      ),
      section(
        "End only after the audit closes",
        "The final audit should revisit the original request instead of grading the implementation against whatever happened to be built. It resolves every requested page, link, post, notification transition, visual state, and safety boundary against current evidence, repairing gaps rather than converting them into footnotes.",
        "Only then does a definitive ending carry meaning. A completion statement is not motivational copy; it is the concise result of a requirement-by-requirement proof that no requested work remains and no unreported gate is being treated as done.",
      ),
    ],
  },
  {
    slug: "future-public-case-study-contract",
    title: "A contract for future public case studies",
    excerpt:
      "Draft criteria for adding source links only after visibility, licensing, redaction, and exact release claims are reverified.",
    status: "draft",
    date: PUBLICATION_DATE,
    verifiedAt: RESEARCH_VERIFIED_AT,
    category: "Publishing",
    tags: ["case studies", "source review", "publication"],
    readingTime: 0,
    placement: "build-business",
    visual: {
      variant: "workspace-beacon",
      alt: "A dim unpublished case-study marker waits behind a verification gate.",
    },
    project: "Cumulus lab",
    sourceLinks: [GITHUB_VISIBILITY_SOURCE],
    relatedSlugs: [
      "writing-from-verifiable-boundaries",
      "backlinks-that-do-not-pretend",
      "completion-is-a-proof-obligation",
    ],
    body: [
      section(
        "Recheck visibility at publication time",
        "Repository visibility can change after an audit, so a remembered public status is not enough. The future checklist will verify anonymous reachability immediately before adding a project link and will confirm that the intended branch and material are actually available to a reader.",
        "A public response alone does not grant reuse rights. License files and notices must be inspected before a case study reproduces source, and original prose should remain the default even when the implementation later becomes visible.",
      ),
      section(
        "Review every media artifact",
        "Screenshots, terminal captures, diagrams, and logs need an independent disclosure review. Real user data, local paths, provider identifiers, credentials, private URLs, and operational records must be absent rather than blurred into a still-recoverable image.",
        "Synthetic examples are usually stronger teaching material because every label was designed for publication. They let the article demonstrate a workflow without making a private working session carry the burden of becoming safe after the fact.",
      ),
      section(
        "Match the claim to current evidence",
        "A public repository still does not prove deployment, a release, or production readiness. The final case-study contract will identify those claims separately and will publish only the ones supported by current artifacts or live verification.",
        "This entry remains a draft because the checklist itself should be tested against the first real public conversion. Until then, related published logs explain the evidence and backlink rules without presenting a speculative policy as completed practice.",
      ),
    ],
  },
] as const;

interface DepthNote {
  headings: readonly [string, string, string];
  paragraphs: readonly [string, string, string, string, string, string];
}

const DEPTH_NOTES: Readonly<Record<string, DepthNote>> = {
  "trust-root-before-product-surface": {
    headings: [
      "Prove the invisible layer first",
      "Sequence convenience after invariants",
      "Verification must survive the interface"
    ],
    paragraphs: [
      "Consider a fictional document exchange called Northstar. Before its team draws a dashboard, it models five facts: who acts, which organization owns the action, where data is stored, what event must be recorded, and which key context protects the bytes. A command-line fixture creates two tenants and attempts one permitted read plus one forbidden cross-tenant read. The visible product is deliberately plain. The first milestone is evidence that identity, storage, audit, and cryptographic context agree about the same boundary.",
      "This ordering costs momentum that stakeholders can see. A polished screen can attract feedback sooner, while an invisible trust layer is harder to demonstrate. The alternative is a thin vertical slice that includes a small interface, but every button still calls the same authorization and audit contracts used by later surfaces. That compromise works only if mock shortcuts cannot bypass the contracts. Otherwise the prototype teaches the team a false architecture and turns temporary convenience into a migration problem.",
      "The sequencing rule is not an argument for designing every security feature in advance. It protects a narrow set of invariants while leaving product questions open. Northstar might prove tenant isolation without deciding its final navigation, billing model, or cloud provider. It might record typed events without claiming an immutable external ledger. The limit matters: a trustworthy local model is evidence about behavior under its stated conditions, not evidence of deployment, certification, operational monitoring, or resistance to every privileged attacker.",
      "A useful review asks whether the interface could accidentally become a second policy engine. If one screen filters records after fetching them, while another embeds tenant scope in the request, their similar appearance hides different guarantees. Move the decision behind one typed boundary, then make both screens consume it. Keep presentation concerns such as sorting and empty states outside. The goal is not architectural purity; it is ensuring that a new surface cannot silently reinterpret ownership, release status, or audit obligations.",
      "Verification should begin below the browser and finish through it. Test allowed and denied operations directly against the trust boundary, restart the process to confirm durable state, corrupt a synthetic record to exercise failure handling, and then repeat representative paths through the interface. Record which layers were exercised and which were simulated. A screenshot proves layout, not isolation. A passing unit test proves a function, not wiring. Confidence comes from a chain of focused checks whose scopes overlap without being mistaken for one another.",
      "This entry is original Cumulus lab analysis built from a hypothetical example. It does not quote, expose, or verify any nonpublic project source, and it makes no claim that a named product implements or has passed these controls. Applying the pattern to a real system would require current architecture review, executable tests, deployment evidence, and an explicit threat model. Until those exist, the honest conclusion is limited: starting with invariants can improve design discipline, but it does not establish production security or operational readiness."
    ]
  },
  "three-boundaries-one-workflow": {
    headings: [
      "Privacy has a direction",
      "Release is an explicit transition",
      "Test denied flows as first-class behavior"
    ],
    paragraphs: [
      "Imagine a synthetic negotiation workspace shared by Alder, the buyer, and Bracken, the seller. Alder keeps valuation notes that Bracken must never see. Bracken keeps preparation drafts that Alder cannot inspect. A third area contains only material deliberately released into the negotiation. Treating all three as folders inside one room is insufficient, because their allowed flows differ. The model needs separate authorization meanings for buyer-private, seller-private, and shared-workflow data, even when one service stores and displays every category.",
      "The central operation is not copy; it is release. In the example, Bracken selects a finished memorandum, confirms its destination, and creates an event describing the transition into shared space. The shared item receives its own identity and provenance instead of inheriting access through a folder move. Alder's private annotations never participate in the reverse direction. This explicit transition creates a point where policy, consent, and audit can agree, and where a failed attempt can leave the source and destination unchanged.",
      "Separate stores are one alternative, and they can make accidental joins harder. A unified store with mandatory party and workflow scope can simplify transactions and querying. Neither shape is automatically safer. Separate stores still need correct routing, while a unified store needs fail-closed predicates on every path. The tradeoff should be evaluated with failure scenarios: a missing scope, a stale session, an export job, and a newly added search endpoint. Architecture earns trust by constraining those mistakes, not by choosing a fashionable topology.",
      "Three boundaries do not answer every collaboration question. Participants may belong to multiple organizations, shared artifacts may be superseded, and legal retention may conflict with a deletion request. The model should name those unresolved policies instead of hiding them in a generic room role. It should also distinguish confidentiality from integrity and availability. Correct party isolation does not prove that releases are authentic, that history is externally immutable, or that the service will remain available during a dispute. Each claim needs separate evidence.",
      "Verification should construct a matrix of actor, party, artifact state, and operation. Exercise permitted reads, forbidden reads, release attempts, repeated releases, stale approvals, and concurrent changes using entirely synthetic records. Confirm both response behavior and state after failure; a denied request that partially publishes metadata is still a defect. Then inspect audit events for completeness without treating the log itself as authorization. Property-based generation can broaden combinations, while a small named matrix keeps the intended business rules understandable to reviewers.",
      "This is original Cumulus lab analysis using fictional parties and records. It reveals no nonpublic project source and makes no assertion that any named system implements, deploys, or has verified this three-boundary model. A real evaluation would need current schemas, every read and export path, identity lifecycle rules, concurrency tests, and operational evidence. The pattern offers a vocabulary for directional privacy; it is not proof of regulatory compliance, legal sufficiency, external immutability, or successful use with actual transaction data."
    ]
  },
  "envelope-encryption-as-protocol": {
    headings: [
      "Specify the envelope grammar",
      "Publish plaintext only after success",
      "Verify properties instead of labels"
    ],
    paragraphs: [
      "Suppose a fictional archive encrypts a large report in bounded frames. Each frame carries a position, authenticated context, ciphertext, and a tag; separate metadata identifies the algorithm version and the wrapped document key. The context binds the envelope to a tenant and document identity so copied bytes cannot be accepted under another record. Calling this envelope encryption says little by itself. The protocol becomes reviewable only when field grammar, size limits, key routing, nonce rules, and terminal conditions are explicit.",
      "A safe reader stages output until every required check succeeds. In the synthetic archive, frame three authenticates but frame four is truncated. The reader must return an error without publishing the first three plaintext frames to the caller-visible destination. This can require a temporary buffer or a transactional output sink, which increases memory or storage pressure. The alternative, immediate streaming, lowers latency but exposes partial content unless the consumer is itself designed to quarantine data until the final envelope result is known.",
      "Context binding has its own tradeoff. Including tenant, document, version, and frame position in authenticated data prevents useful ambiguity, yet it makes migrations and legitimate moves explicit operations. That friction is valuable when relocation should be audited, but costly if identifiers change casually. A design can introduce a stable cryptographic identity separate from display names, or define a re-encryption transition. What it should not do is silently weaken context matching simply because metadata evolution was left until late in development.",
      "The protocol cannot manufacture key security outside its boundary. Perfect frame validation does not prove that wrapping keys are hardware protected, rotated correctly, unavailable to operators, or recoverable after disaster. Local test keys can demonstrate parsing and failure behavior while proving nothing about production custody. Likewise, authenticated encryption detects unauthorized changes under its assumptions; it does not establish who originally authorized a document. Claims should name the key-management and identity systems on which the envelope depends, or remain deliberately narrow.",
      "Verification should mutate one dimension at a time: frame length, order, nonce, context, version, tag, wrapped-key identifier, and final-frame marker. Tests must assert both error classification and absence of published plaintext. Round trips cover success but not ambiguity, so add independently constructed malformed envelopes and boundary lengths. Confirm that repeated decoding is deterministic and that unsupported versions fail closed. Reviewers should also inspect resource caps, because an authenticated length field can still become a denial-of-service input before authentication completes.",
      "This essay is original Cumulus lab analysis around a wholly synthetic envelope. It includes no private source, key material, format constant, or operational fact, and it makes no claim that a named project implements or has validated this protocol. Real assurance would require a published specification, implementation review, known-answer and adversarial tests, key-custody evidence, and deployment-specific threat analysis. The discussion supports a design method only; it does not establish certification, production encryption at rest, hardware-backed protection, or independent cryptographic approval."
    ]
  },
  "drafts-without-publication-authority": {
    headings: [
      "Authorize sources before generation",
      "Keep proposals separate from effects",
      "Exercise the path that must stay impossible"
    ],
    paragraphs: [
      "Picture a fictional assistant preparing a release note from three approved paragraphs. The request names those sources, their permitted purpose, and a destination draft. The model receives no broader workspace and returns text plus lineage identifiers. The result enters a pending-review state; it has no route to the public site. This design treats source access, generation, and publication as different permissions. A fluent answer cannot enlarge its own source scope, invent approval, or convert a drafting capability into release authority.",
      "The obvious alternative is a single automation that gathers context, drafts, and publishes when confidence exceeds a threshold. That shortens the happy path and may suit low-risk reversible output. It also combines distinct failures: excessive source access, misleading generation, and unauthorized effect. A safer compromise automates preparation and validation while requiring a separately authenticated approval transition. The reviewer should see the proposed text, source lineage, destination, and material changes together, not approve an opaque score or a notification detached from the artifact.",
      "Human approval is not magic. A rushed reviewer can accept fabricated claims, misunderstand lineage, or approve content whose source permission has expired. The workflow therefore needs useful review ergonomics and deterministic checks around the model: required citations, prohibited destinations, schema validation, and source reauthorization at the time of effect. High-impact domains may require two reviewers or specialist signoff. The principle is narrower than human-in-the-loop branding: no component should exercise authority that was granted only for drafting.",
      "A synthetic failure illustrates the boundary. After generation, one source is withdrawn and the reviewer presses publish from an old tab. The system should recheck source authorization and artifact version, reject the stale approval, and leave the draft pending or invalidated. It should not regenerate silently, because that would create a different artifact under the old decision. Versioned proposals and one-time approval tokens add ceremony, but they make the approved object precise and create a clean explanation when conditions change.",
      "Verification must attempt the forbidden transitions directly. Call any publication endpoint with model credentials, omit reviewer identity, replay an approval, alter the draft after approval, revoke a source, and race two reviewers. Assert that no public record, outbound notification, or side effect appears after denial. Then test the legitimate sequence end to end with synthetic content. Audit records should explain who proposed and who approved without becoming a substitute for enforcement. Red-team prompts are useful, but capability tests provide the stronger boundary evidence.",
      "This entry is original Cumulus lab analysis using an invented assistant and workflow. It discloses no nonpublic project source or operational state and does not claim that any named product implements, ships, or has passed these controls. A real assessment would require current capability maps, provider behavior, identity and revocation rules, every side-effect path, and observed deployment evidence. The proposal separates drafting from publication authority; it does not guarantee factual output, adequate human judgment, legal approval, or safe autonomous operation."
    ]
  },
  "assembly-makes-assumptions-visible": {
    headings: [
      "Ownership cannot remain implicit",
      "Bounds become part of behavior",
      "Prototype labels preserve the lesson"
    ],
    paragraphs: [
      "Imagine a teaching forge whose parser is written directly against an x86-64 calling convention. A request arrives as a pointer and explicit length, temporary objects live in a fixed arena, and every helper reports success or a concrete error. The exercise forces questions that managed runtimes often answer invisibly: who owns the bytes, how long they remain valid, what alignment a callee expects, and what happens at capacity. Assembly does not create rigor automatically, but it makes omitted agreements immediately expensive.",
      "A synthetic object header demonstrates the effect. The parser receives twenty bytes, finds a declared name length of thirty, and rejects the input before advancing a shared cursor. There is no growable string to absorb the mismatch and no exception runtime to unwind partially written state. The author must choose a maximum, an error convention, and an output-publication rule. Those choices become inspectable behavior. The same discipline can be implemented in safer languages, but assembly removes many opportunities to postpone the decision.",
      "The tradeoff is substantial. Explicit syscalls, register preservation, bounds checks, and buffer ownership consume time that a higher-level implementation could spend on protocol coverage and user needs. Tooling, portability, and contributor access are narrower. One alternative is to specify pointer-length and arena contracts in a systems language with stronger static checks, then reserve assembly for measured hot paths. The educational value remains: compare generated or handwritten boundaries and ask which assumptions are guaranteed, documented, tested, or merely conventional.",
      "Visibility should not be confused with correctness. An explicit capacity can still be wrong, an error path can clobber a register, and a syscall wrapper can mishandle interruption. Fixed arenas also trade memory predictability for hard ceilings that may reject legitimate workloads. Review must cover integer overflow, aliasing, lifetime, concurrency, ABI compliance, and hostile lengths. The absence of hidden allocation is one useful property, not a certificate. Simplicity claims should be tied to measured control flow and tests, not source aesthetics.",
      "Verification can combine focused vectors with differential behavior against public Git specifications and tools. Feed valid and malformed synthetic objects at zero, one-below, exact, and one-above each bound. Check error codes, unchanged outputs, arena reuse, and guard bytes. Run the same corpus under instrumentation where possible, then repeat on the intended architecture and operating system. Differential agreement is evidence about tested cases, not full compatibility; disagreements need classification rather than automatic treatment of either implementation as the oracle.",
      "This is original Cumulus lab analysis and a hypothetical assembly exercise, not a report on a private codebase. It contains no nonpublic project source and makes no claim that any named forge implements these contracts, matches Git, or has passed delivery review. Public Git documentation can ground protocol expectations, but implementation status requires accessible source and reproducible evidence. Until those exist, the safe claim is conceptual: low-level work can expose assumptions while remaining a prototype, with production readiness and feature parity explicitly unasserted."
    ]
  },
  "reproducible-builds-evidence-contract": {
    headings: [
      "Reproduction starts with candidate identity",
      "Compare artifacts rather than recollections",
      "Evidence expires when inputs change"
    ],
    paragraphs: [
      "A synthetic release team selects commit Cedar, records a pinned compiler and linker, and creates two clean build directories. Each build receives the same locale, timestamps, path mapping, feature flags, and dependency inputs. The team then compares final bytes and a manifest describing sections and bundled assets. Building twice is only the visible act. The evidence contract is the recorded identity of every relevant input, isolation from the developer workspace, and a result that another reviewer can attempt to reproduce.",
      "Exact byte equality is powerful but not universal. Debug paths, signatures, archive ordering, and embedded timestamps can differ without changing executable behavior, while apparently equal outputs can still contain the same malicious input. One alternative defines a normalized comparison and documents excluded fields; another redesigns the build until those sources become deterministic. The choice should be explicit. Reproducibility answers whether declared inputs lead to the same artifact. It does not answer whether the source is trustworthy, the compiler is honest, or the artifact is safe.",
      "Cross-building adds another boundary. A developer can produce an artifact for a target platform from a convenient workstation, yet that success does not demonstrate native execution, loader compatibility, system-call behavior, or packaging on the target host. Treat the cross-build as an earlier gate and preserve its logs, then run acceptance against the exact candidate in the declared environment. Rebuilding during acceptance changes the subject. The artifact digest, toolchain record, and test report must point to one object if they are to support one conclusion.",
      "A hermetic container or declarative build environment can reduce variation, but it moves trust into image construction, base layers, and dependency resolution. Two builds using the same opaque image may agree because they repeat the same hidden state. Useful evidence therefore includes how the environment was derived and pinned, not merely its name. Independent builders provide stronger diversity when practical. The cost is maintenance and diagnosis: when bytes differ, the team needs enough manifest detail to locate the first meaningful divergence rather than rerun blindly.",
      "Verification should include a deliberately dirty workspace to prove the release process refuses it, a changed environment variable to confirm normalization, and isolated paths of different lengths to expose embedded directories. Compare artifact hashes, section inventories, dependency manifests, and test identities. Retain failures as evidence about the gate. Most importantly, change one source byte after a successful run and ensure the old attestation cannot attach to the new candidate. A reproducibility record is immutable history, not a reusable badge for a branch name.",
      "This entry is original Cumulus lab analysis based on an invented release candidate. It publishes no nonpublic source, build record, commit, or project state and makes no claim that a named project has achieved reproducibility or release acceptance. Public Git materials may inform compatibility expectations, but current implementation and candidate status require separately accessible evidence. The method described establishes a testable evidence contract only; it does not establish supply-chain integrity, independent review, native-host success, production readiness, or safety of the resulting program."
    ]
  },
  "parse-completely-publish-once": {
    headings: [
      "Keep caller state untouched during parsing",
      "Bound identities and structure together",
      "Testing breadth still needs a stated limit"
    ],
    paragraphs: [
      "Consider a synthetic tag parser that receives bytes and a caller-owned result structure already containing a valid object. It parses the new candidate into temporary state, validates every header, identity, delimiter, and terminal condition, and copies into the result only after full success. When the input ends halfway through a signature block, the old result remains intact. This publication rule turns error handling into an observable contract: failure means no new caller-visible value, not a partially useful object whose safe fields are left for callers to guess.",
      "The same pattern applies to a synthetic tree containing repeated entries and variable-length names. Before publishing any collection, the parser validates total bounds, each entry boundary, forbidden names, ordering rules, object identifiers, and exact consumption of the input. A valid prefix followed by trailing garbage is not accepted as success. Complete parsing prevents downstream code from accidentally treating unchecked suffixes as irrelevant. It also gives fuzzers a crisp invariant: either one fully validated value appears, or the original output remains byte-for-byte unchanged.",
      "Temporary state costs memory and may delay streaming. For very large inputs, a transaction-like sink can stage validated chunks and commit once, while a two-pass parser can validate structure before materialization. Both alternatives add complexity and may reread data. Immediate mutation is simpler only when rollback is complete and proven, which is rarely free. The right design depends on bounds and caller needs, but the public contract should remain unambiguous about what survives failure and whether any callback can observe provisional data.",
      "Complete validation is still scoped validation. A parser may guarantee structural safety without verifying signatures, reachability, semantic history, or repository-wide consistency. It may intentionally support only a documented subset of a public format. That limit should appear beside the success contract so callers do not promote parser acceptance into a broader integrity claim. Likewise, bounded name lengths and object counts are product policies, not universal format truths. Interoperability testing should distinguish an intentional ceiling from accidental incompatibility or memory corruption.",
      "Verification should preserve a valid sentinel output, then feed truncations at every byte, oversized lengths, duplicate fields, reordered records, invalid encodings, trailing data, and exact-boundary cases. Assert return classification, cursor position, allocation cleanup, and sentinel preservation. Differential tests against public Git tools can reveal disagreements, but each disagreement needs interpretation because tools may accept extensions or normalize inputs differently. Coverage-guided fuzzing expands the search; a hand-written corpus protects the semantic rules reviewers must be able to name and understand.",
      "This essay is original Cumulus lab analysis using fictional formats and records. It exposes no nonpublic source and does not claim that any named project implements these parsers, covers the complete Git format, or has passed compatibility review. Public Git manuals can supply external behavioral references, while implementation claims require accessible code and repeatable tests. The proposed rule supports safer caller contracts; it does not prove total memory safety, full object verification, repository integrity, performance suitability, or production completeness beyond the explicitly tested input domain."
    ]
  },
  "wrong-host-is-not-a-pass": {
    headings: [
      "A skipped check proves nothing",
      "Source presence is not delivered behavior",
      "Bind acceptance to one host and artifact"
    ],
    paragraphs: [
      "Imagine a synthetic release gate for an x86-64 Linux command-line tool. A developer runs it on a different operating system where the runtime test cannot execute. Reporting green because compilation succeeded would merge two claims: source can produce a target artifact, and that artifact behaves correctly on its target host. The gate should instead fail with an explicit wrong-host classification. That result is useful evidence about the environment, but it is not acceptance, and a skipped runtime check must never increment a passed-delivery count.",
      "Failing closed can slow contributors who lack the target machine. A practical pipeline separates portable checks, cross-build checks, and native acceptance, so earlier feedback remains available without diluting the final claim. Emulation may catch instruction and loader problems, while a virtual machine can approximate the operating environment. Neither should be silently relabeled as native evidence. Each lane records what ran, where it ran, and which exact artifact it examined. The inconvenience is intentional: conclusions remain proportional to the environment actually exercised.",
      "Source presence creates another tempting shortcut. A repository may contain a command, tests, documentation, and packaging scripts, yet the release artifact can omit the object, link an older implementation, or route around it. Acceptance should begin from the candidate binary and prove the feature through its supported interface. Build manifests can connect source to artifact, but runtime behavior closes the loop. Review language should distinguish implemented in source, included in candidate, exercised on target, and approved for delivery as four separate states.",
      "Host identity must include more than a processor label. Kernel interfaces, dynamic loader, C library expectations, filesystem semantics, and packaging context can affect behavior. The gate should record the dimensions that matter to its claim and refuse unknown combinations. This does not require testing every distribution before making any statement; it requires saying exactly which environment passed. Broader support can then accumulate as separate evidence. A generic works on Linux label is weaker than a precise result and often harder for users to act upon.",
      "Verification should force the wrong-host branch in CI and assert a nonzero result with an unmistakable explanation. On the intended host, confirm the candidate digest before and after tests, exercise installation into an isolated prefix, run representative commands, and verify expected failure behavior. Ensure that missing dependencies and skipped tests cannot be counted as success. Finally, alter the binary after attestation and confirm the report no longer applies. The gate's most important product is not a green icon but a trustworthy mapping from evidence to claim.",
      "This entry is original Cumulus lab analysis around a hypothetical release gate. It includes no private source, CI record, account detail, or current project state and makes no claim that any named tool has passed or failed native acceptance. Public Git documentation can inform command semantics, but delivery status requires accessible candidate evidence. The principle is intentionally limited: wrong-host refusal protects claim integrity; it does not prove feature parity, security review, deployment safety, legal readiness, or production operation even after the correct host passes."
    ]
  },
  "one-budget-equation-every-backend": {
    headings: [
      "Work the invariant before routing",
      "Choose reduction over hidden expansion",
      "Test both sides of the boundary"
    ],
    paragraphs: [
      "Consider a synthetic request with an eight-thousand-unit context allowance. The policy reserves fifteen hundred units for output and five hundred for estimation error, leaving six thousand for instructions, history, repository excerpts, and the new prompt. Those inputs initially total sixty-four hundred, so the host removes four hundred units according to a declared reduction order before any backend is selected. The numbers are illustrative, but the sequence matters: one inspectable equation decides admissibility before local or remote transport can introduce provider-specific behavior.",
      "A useful invariant names every term and its owner. Static instructions, selected context, conversation history, and user input consume the input side; requested completion and a conservative margin consume the reserve. Estimation should use one documented method even when providers tokenize differently, because mixing estimates makes comparisons misleading. The approved request can then carry its measured budget to exactly one route. An adapter may translate protocol details, but it should not append hidden instructions, recover discarded history, or quietly enlarge the completion allowance after approval.",
      "Aggressive truncation is the simplest way to satisfy a fixed ceiling, yet it can remove the evidence most relevant to an answer. An alternative ranks context by an explicit policy, summarizes older dialogue deterministically where possible, or rejects the request and asks the user to narrow it. Each choice trades convenience, fidelity, latency, and implementation complexity. A conservative cross-backend ceiling may also leave capacity unused on larger models, but that waste buys predictable behavior and makes privacy or cost review independent of whichever backend happens to be available.",
      "The equation cannot guarantee a good answer, a provider's exact billing count, or equivalence between tokenizers. It also cannot decide which context is truthful, authorized, or useful. Safety margins reduce estimation risk without eliminating it, and summarization can introduce distortion even when it fits perfectly. Separate controls still need to govern source permission, backend selection, request timeouts, retention expectations, and output review. The budget policy is therefore a resource boundary, not a general model-safety claim or evidence that every supported route behaves identically.",
      "Verification should exercise one unit below, exactly at, and one unit above each relevant boundary. Tests can generate synthetic histories and repository excerpts, assert the selected reduction order, and confirm that over-budget rejection occurs before an adapter is called. Repeat identical inputs across available estimators and ensure each result is deterministic under its declared version. Then make an adapter attempt to add context and verify the contract refuses it. Logs should report term totals and decisions without copying sensitive prompt content into diagnostic evidence.",
      "This entry is original Cumulus analysis using invented capacities, requests, and routes. It contains no nonpublic project source, prompt, configuration, benchmark, or operational state, and it makes no claim that a public Local Harness implementation exists or enforces this equation. The public Codex CLI guide provides general context for command-line model workflows, not evidence for the hypothetical design described here. Real implementation claims would require accessible code, documented estimators, focused boundary tests, and observed adapter behavior for each declared backend and version."
    ]
  },
  "repository-context-is-capability": {
    headings: [
      "Turn selection into a capability",
      "Narrow discovery without promising safety",
      "Prove denial as carefully as access"
    ],
    paragraphs: [
      "Imagine a synthetic workspace containing a tracked source file, an ignored credential-shaped fixture, and a symlink pointing outside the selected root. A user explicitly selects the workspace and approves a small read budget. Deterministic host code canonicalizes the root, asks Git for eligible tracked names, rejects the escaping link, and reads only the bounded source file. Merely typing any of those names into chat grants nothing. The worked example separates discussion from authority: text can describe a location, while a scoped capability permits specific discovery and reads.",
      "The capability should bind root identity, allowed operations, expiry, and quantitative limits rather than expose a reusable path string. Discovery and reading remain separate steps: a tracked name can be eligible for consideration without being automatically included in a prompt. Before publication, each candidate passes containment, type, size, and total-budget checks, with failures leaving the prior approved context unchanged. This resembles zero-trust reasoning at a local boundary because proximity is not treated as authorization; every transition receives an explicit, narrowly scoped decision.",
      "Scanning the whole tree and filtering afterward is convenient because tools can reuse familiar recursive walkers. It also touches material that never needed consideration and makes symlink, ignore, and error behavior harder to audit. Tracked-file discovery offers a narrower alternative, while an explicit allowlist can be tighter still for small tasks. The tradeoff is incomplete context: untracked generated files or newly created work may be omitted. A good interface reports that limit and lets the user expand scope deliberately instead of silently broadening discovery.",
      "Tracked status is not a security label. A repository can intentionally contain secrets, enormous fixtures, submodules, unusual file types, or content owned by a different policy domain. Canonical containment can reduce traversal risk but does not prove that bytes are safe to send to a model. Hardlinks, filesystem races, changing worktrees, and helper-process behavior also complicate a simple root check. The capability model must therefore be paired with stable handles where practical, bounded reads, source classification, destination policy, and clear revocation semantics.",
      "Verification should start with no capability and prove that direct names, relative traversal, absolute-looking text, and model-suggested commands cannot trigger reads. With a synthetic capability, test tracked and untracked files, links crossing the root, hardlink cases where supported, oversized content, binary data, concurrent replacement, expiry, and total-budget exhaustion. Assert both the accepted byte set and the absence of reads on denial. Public demos should use fabricated repositories, while tests record decisions and identifiers without publishing actual workspace names or selected content.",
      "This entry is original Cumulus analysis built around a fictional repository and invented files. It includes no nonpublic project source, filename, workspace detail, access record, or current operational state, and it makes no claim that a public Local Harness implementation provides these controls. Public Git documentation explains tracked-name discovery, while NIST zero-trust guidance informs the general authorization posture; neither proves this design exists. Implementation assurance would require accessible host code, filesystem threat analysis, adversarial tests, and evidence for every supported platform and model destination."
    ]
  },
  "no-silent-local-to-remote": {
    headings: [
      "Treat the route as approved state",
      "Make fallback a new decision",
      "Test that errors preserve locality"
    ],
    paragraphs: [
      "Consider a fictional request containing a private draft that the user assigns to an on-device model. The local runtime becomes unavailable after the host has approved the prompt and budget. Instead of forwarding the same bytes to a network service, the host returns a typed local-unavailable error and preserves the draft for an explicit retry decision. If the user later chooses a remote route, the system rebuilds and reapproves that request under the remote policy. Failure does not rewrite the destination that originally carried consent.",
      "Backend choice should travel with the approved request as immutable routing state, alongside the context digest, budget result, and destination policy. A local adapter can translate the request for a local runtime, while a remote adapter can translate a separately approved remote request. Neither adapter owns authority to choose the other. This arrangement keeps transport code mechanically narrow and prevents retry libraries from turning availability handling into data export. Error classification remains deterministic host behavior rather than a suggestion that a model or provider can reinterpret.",
      "Automatic remote fallback can reduce interruption and may be appropriate when all data is already approved for both destinations. The safer general alternative is an explicit retry prompt that explains the boundary change, shows whether context will differ, and asks for renewed authorization. That interaction adds latency and can frustrate users during local outages. A remembered preference can reduce repetition, but it should name scope and expiry; a blanket consent buried in setup risks becoming silent fallback again when data sensitivity or provider terms change.",
      "Local execution is not automatically private, safe, or offline. A local runtime may log prompts, load networked extensions, expose data to other processes, or use artifacts obtained from external providers. Conversely, a remote service may offer contractual protections that matter in a particular deployment. The rule here is limited: do not change an approved destination because another route is convenient. Separate assessment is required for storage, telemetry, retention, residency, credentials, model integrity, and user-visible error recovery on every route.",
      "Tests should inject local startup failure, midstream termination, timeout, malformed output, cancellation, and capacity exhaustion while a remote adapter records every invocation. For a local-approved request, each failure must produce zero remote calls and a clear classification. Then exercise an explicit remote retry and verify that a new approval record and request identity are created. Concurrency tests should race retries and cancellations to ensure stale work cannot cross routes. Diagnostic output must identify the chosen boundary without reproducing the protected prompt or hidden credentials.",
      "This entry is original Cumulus analysis using a synthetic draft, fictional adapters, and invented failures. It contains no nonpublic project source, prompt, provider configuration, telemetry, or runtime result, and it makes no claim that a public Local Harness implementation enforces route preservation. NIST zero-trust guidance supports the general principle of explicit, scoped decisions but does not document this hypothetical system. A real claim would require accessible routing code, adapter contracts, provider-specific data analysis, failure-injection tests, and observed evidence that every retry path preserves authorization."
    ]
  },
  "deterministic-container-lifecycle": {
    headings: [
      "Parse commands into a finite plan",
      "Trade convenience for inspectable authority",
      "Verify ownership before cleanup"
    ],
    paragraphs: [
      "Imagine a synthetic command asking for a temporary development machine with two processors, four units of memory, and a bounded workspace mount. A deterministic parser accepts only documented fields, converts quantities into typed values, and produces a finite plan: validate inputs, create one owned resource, wait for readiness, run a fixed argument vector, collect a status, and clean up that resource. No model interprets the command after parsing. Unknown adjectives, extra stages, or out-of-range values fail before any lifecycle side effect begins.",
      "The plan should assign a fresh run identifier and record the exact resource handles returned by successful creation steps. Later stages operate on those handles, not on names reconstructed from user text. Cancellation moves through explicit states and cleanup considers only resources whose ownership evidence belongs to that run. Fixed argument vectors avoid shell reinterpretation, while typed timeouts and output limits bound waiting and capture. This makes lifecycle behavior reviewable as ordinary code, including partial creation, readiness failure, command failure, cancellation, and repeated cleanup.",
      "Free-form agent orchestration can understand richer requests and repair unexpected conditions, but it also broadens interpretation and makes side effects harder to predict. A deterministic command language sacrifices expressiveness for stable semantics and testable authority. One alternative places a model only in a planning interface, then requires the user to review a fully typed plan before deterministic execution. That can support varied workflows without letting generated prose run directly, though plan review becomes a meaningful approval step rather than a decorative confirmation screen.",
      "Determinism does not remove platform uncertainty. Image availability, virtualization support, resource pressure, daemon behavior, and operating-system updates can change outcomes even when the same plan is executed. Ownership records can also disappear after a crash, leaving resources that conservative cleanup cannot safely identify. The lifecycle must document recovery boundaries and prefer an orphan requiring manual review over deletion based on a vague name match. Separate controls still govern image trust, mount confidentiality, network access, guest isolation, and the safety of commands executed inside the resource.",
      "Verification should cover parser rejection, exact bounds, fixed arguments, state transitions, and ownership-safe cleanup. Use a fake lifecycle driver to inject failure after every successful stage, then assert which compensating actions occur and that repeated cleanup is idempotent. Add cancellation races before creation, during readiness, during execution, and after completion. Integration tests on declared hosts can confirm public container-machine semantics without turning one platform result into universal proof. Seed unrelated similarly named resources and verify that no failure path ever selects or deletes them.",
      "This entry is original Cumulus analysis around an invented command, plan, and machine lifecycle. It contains no nonpublic project source, host configuration, resource name, execution log, or current implementation state, and it makes no claim that a public Local Harness implementation provides this behavior. Apple's public container-machine documentation and the public Codex CLI guide offer general interface context, not evidence for this design. Implementation claims would require accessible parser and executor code, platform-specific tests, ownership records, cancellation evidence, and review of every enabled side-effect capability."
    ]
  },
    "control-plane-you-can-read": {
      headings: [
        "Review the declared team as data",
        "Keep runtime residue outside the contract",
        "Test schema meaning, not mere syntax"
      ],
      paragraphs: [
        "Imagine a synthetic studio called Lantern describing a three-role research team in one TOML document. The file names a coordinator, two bounded workers, their permitted work categories, and a shared concurrency ceiling. A reviewer can compare a proposed edit with the previous version before any controller reads it. TOML supplies a readable mapping of keys, values, arrays, and tables; Lantern's application schema supplies the meanings. Keeping those layers distinct makes the example inspectable without pretending the format itself understands agents or authority.",
        "A single manifest favors review and portability, but it can become awkward when configuration depends on live discovery or frequent per-user choices. A graphical editor backed by a database may offer stronger workflows, while generated configuration can reduce repetitive typing. Either alternative needs an exportable, validated contract if humans must audit changes. The useful rule is not that every fact belongs in TOML; it is that declared roles, limits, and escalation choices should have one unambiguous representation instead of conflicting copies across interfaces.",
        "Readability does not make a setting safe. A perfectly valid document can request an unavailable model, duplicate a semantic role under different names, or combine permissions that the product policy forbids. Conversely, rejecting every unknown field can slow forward compatibility when older readers encounter newer manifests. Versioned schemas and explicit migration tools make that tradeoff visible. The parser should enforce TOML's syntax, while a separate validator enforces domain rules and explains whether a failure concerns format, schema version, or policy.",
        "Runtime identifiers, current task status, event cursors, caches, and retry counters do not automatically belong in the human contract. Folding them into Lantern's manifest would make a clean declaration change whenever work runs and could let stale generated state travel to another machine. A complete snapshot is useful for diagnostics or recovery, but it should be labeled separately and treated as derived evidence. The manifest remains a statement of intended configuration, while runtime records describe what a particular execution observed under that intention.",
        "Verification should parse valid fixtures, reject invalid UTF-8, duplicate keys, repeated tables, unsupported fields, unsafe combinations, and out-of-range limits. It should reorder independent keys to confirm that presentation order does not change meaning, then serialize a canonical view and compare the validated structure. A synthetic editor test can load revision A, save revision B, and prove that a stale revision A write receives a conflict. Finally, every consumer should receive the same normalized configuration rather than interpreting raw text independently.",
        "This entry is original Cumulus analysis using the wholly synthetic Lantern example. No public TOML Agent project source is used or asserted here, and this entry makes no implementation claim about that project. It also contains no nonpublic configuration, account detail, or observed runtime state. The public TOML specification supports only statements about document syntax and data mapping. A real implementation would require an accessible schema, consumer code, migration behavior, permission review, and repeatable tests; human readability alone does not prove correctness, security, deployment, or availability."
      ]
    },
    "save-is-not-run": {
      headings: [
        "Give Save one observable effect",
        "Freeze the contract of active work",
        "Prove every transition independently"
      ],
      paragraphs: [
        "Consider a synthetic editor for a fictional team called Meridian. An operator changes a worker limit from two to three and presses Save. The editor validates the candidate, records a new semantic revision, and reports that storage succeeded; the dispatcher count remains zero. A separate Run action names that exact revision before creating work. This example gives each verb one observable effect: Save changes durable configuration, while Run spends execution authority. Neither a successful parse nor a convenient button label silently crosses between them.",
        "Combining Save and Run can shorten a common workflow, especially when users always want an edit to take effect immediately. It also makes accidental execution easier and obscures whether a failure came from persistence or dispatch. A defensible alternative is an explicitly labeled compound action that first displays both planned transitions and stops if either precondition fails. Even then, the audit record should preserve separate outcomes. Convenience may compose the operations, but it should not erase their distinct permissions, error states, or retry semantics.",
        "Suppose Meridian starts a synthetic review under revision seven while another operator saves revision eight. The active review remains bound to seven; idle work may adopt eight after reconciliation. Rewriting the active revision would make later evidence disagree with the rules that actually governed its start. Expected-revision checks also stop two editors from overwriting each other invisibly. A conflict can offer reload, compare, or deliberate replacement, but automatic text merging is unsafe when two syntactically compatible edits change authority in contradictory ways.",
        "A saved revision is not proof that every consumer has loaded it, that referenced capabilities exist, or that future work will succeed. Durable storage, reconciliation, and execution are separate states worth naming. JSON-RPC request identifiers can correlate a synthetic save call with its response, but the specification does not define application durability, revision policy, or file replacement. Notifications are especially unsuitable for a save whose failure matters because, by definition, they provide no response through which the client can confirm an error.",
        "Verification should replace the dispatcher with a counting fake and assert zero dispatches after successful, invalid, conflicting, and retried saves. Then start synthetic work under one revision, save another, and confirm the active record retains its original identity while a later run selects the new one. Inject a storage failure between validation and publication to prove no partial revision becomes current. Protocol tests should match responses by identifier, classify errors deterministically, and show that repeating a completed save does not create duplicate execution.",
        "This entry is original Cumulus analysis built around the invented Meridian workflow. No public TOML Agent project source is used or asserted here, and this entry makes no implementation claim about that project. It includes no nonpublic manifest, event record, or current system state. The public TOML and JSON-RPC specifications establish only format and message conventions relevant to the discussion. Real assurance would require accessible interface contracts, storage semantics, dispatcher code, concurrency tests, and user-facing evidence; the proposed separation does not prove production reliability or authorization correctness."
      ]
    },
    "two-sockets-two-authorities": {
      headings: [
        "Map each channel to one owner",
        "Protocol shape is not transport policy",
        "Attack the boundary from both sides"
      ],
      paragraphs: [
        "Imagine a synthetic desktop tool called Vale with two local Unix-domain channels. One fictional service owns role definitions and execution status; another owns conversation records. The interface asks each owner for its data and carries only opaque conversation references across the boundary. A controller command cannot rewrite a transcript, and a conversation query cannot grant a role permission. The worked example uses two channels to make ownership visible, not because the number two has protective power or because locality makes either peer inherently trustworthy.",
        "One multiplexed channel is simpler to discover, supervise, and upgrade, and strict method-level capabilities can preserve authority separation inside it. Two channels reduce accidental method mixing but add lifecycle, compatibility, and failure-order questions. A client may reach one owner while the other is unavailable, so partial availability needs an honest interface state. The right topology follows ownership and threat analysis. Splitting transport endpoints is useful when it reinforces separate policy engines, but it is ceremony if one process still holds every credential and accepts every method.",
        "In a synthetic Vale protocol, ordinary JSON-RPC requests carry identifiers so responses can be correlated even when work finishes out of order. Notifications are reserved for events whose missing error response is acceptable. The application adds a length prefix, message ceiling, and version handshake because JSON-RPC defines request and response objects but does not define stream framing. Those additions remain Vale's invented choices. A complete contract must say which methods belong on each channel, how identities are established, and what happens after malformed input.",
        "Owner-only socket permissions and the absence of a TCP listener can narrow exposure, but they do not authenticate every same-user process or protect a compromised account. Endpoint separation also does not prevent sensitive values from leaking through logs, crash reports, or overly broad diagnostics. Systems with multiple users, containers, remote sessions, or platform-specific socket behavior need their own analysis. If stronger peer identity is required, capability-bearing handshakes or operating-system credentials may help, yet those mechanisms introduce rotation, recovery, and portability costs that must be tested.",
        "Verification should connect each synthetic client to the wrong channel and expect a method-level refusal without state change. Send malformed JSON, an oversized frame, an unknown version, duplicate identifiers, replayed events, and a notification that would be unsafe without confirmation. Restart one owner while leaving the other available, then confirm the interface labels partial state instead of merging stale snapshots. Permission tests should use isolated fictional accounts, while diagnostic tests seed credential-shaped canaries and prove default exports omit them. Every failure should remain bounded to its owner.",
        "This essay is original Cumulus analysis using the entirely fictional Vale protocol. No public TOML Agent project source is used or asserted here, and this entry makes no implementation claim about that project. It reveals no nonpublic socket name, message schema, credential, diagnostic output, or deployed topology. The public JSON-RPC specification supports only the described request, response, notification, and identifier semantics. Evaluating a real design would require accessible protocol definitions, operating-system assumptions, authorization code, adversarial tests, and deployment evidence; two local sockets alone do not prove isolation or security."
      ]
    },
    "concurrency-without-grandchildren": {
      headings: [
        "Make the arithmetic include the lead",
        "Flatten delegation to control fan-out",
        "Measure completion, cancellation, and cost"
      ],
      paragraphs: [
        "Picture a synthetic documentation review with one coordinator and three workers under a concurrency ceiling of four. The coordinator assigns accessibility, accuracy, and link checks, then queues a fourth worker request until one active slot closes. Counting only delegated workers would allow five simultaneous agents and make the stated ceiling false. The worked example treats the lead as resource-consuming work, even while it waits for results. A scheduler can therefore explain the active set at any instant and reject or queue excess demand deterministically.",
        "A flat team makes every worker visible to the coordinator and prevents a broad instruction from multiplying through recursive delegation. Hierarchical teams can be better when a large program has genuine subdomains and local coordinators reduce the root's cognitive load. That alternative needs separate depth, width, budget, and cancellation rules at every level. The public Codex documentation describes configurable thread and nesting limits, but those runtime controls do not choose the correct product policy. A manifest should state its intended ceiling without silently relying on defaults.",
        "A fixed cap is predictable but may waste capacity when tasks are lightweight or external services are idle. Adaptive scheduling can consider rate limits, tool contention, priority, and observed latency, yet it is harder to reproduce and may starve quiet work. A conservative compromise keeps a hard global ceiling while adjusting only the queue order or permitted width below it. Whatever policy is chosen, unavailable or incompatible model metadata should produce a visible error rather than a silent substitution that changes capability, cost, and review assumptions.",
        "No-grandchildren is a containment rule, not a completeness guarantee. A single worker can still consume excessive tokens, hold a scarce tool, request dangerous approval, or return misleading results. Flat orchestration also concentrates synthesis responsibility in the coordinator and can produce a large context when many reports arrive. Per-worker time, output, tool, and permission bounds remain necessary. The design must define whether cancellation is cooperative or forced, how late results are handled, and whether a failed worker permits partial completion or requires the entire task to remain open.",
        "Verification should run synthetic workers behind deterministic barriers so tests can observe the active count before releases occur. Assert that the coordinator plus workers never exceeds the ceiling, a child spawn attempt fails at the configured depth, and queued work starts only after capacity returns. Exercise worker failure, timeout, cancellation, coordinator interruption, and a late response after cancellation. Record which results contribute to synthesis and prove that an unsupported model request remains an error. Load tests can measure cost and latency without converting those measurements into correctness evidence.",
        "This entry is original Cumulus analysis based on a fabricated review exercise. No public TOML Agent project source is used or asserted here, and this entry makes no implementation claim about that project. It contains no nonpublic configuration, transcript, usage record, or runtime observation. Official Codex documentation provides public context for subagent concurrency and nesting controls only. A real implementation claim would require accessible scheduling code, configuration semantics, failure traces, and repeatable tests; bounded fan-out does not by itself prove result quality, safe approvals, economical operation, or production readiness."
      ]
    },
  "four-nouns-for-live-workbooks": {
    headings: [
      "Name each layer of spreadsheet truth",
      "Keep guidance away from authority",
      "Stop when current cannot be proven"
    ],
    paragraphs: [
      "Imagine a fictional inventory service called Lantern. A Field describes one allowed property, a Record stores one item, a Template guides someone preparing an upload, and Current identifies the workbook version the service presently recognizes. Those nouns prevent a downloaded file from becoming authoritative merely because it looks familiar. JSON Schema can describe structural expectations for fields and records, while the product vocabulary explains lifecycle and authority. The distinction gives support, design, and engineering a shared way to discuss what changed.",
      "In a worked example, Lantern adds an optional maintenance date to its schema. The new Field appears in the next Template, but existing Records remain unchanged and yesterday's exported workbook does not become Current again. An operator imports a candidate, reviews validation, and only a separate selection transition establishes the new Current version. This sequence prevents schema guidance, business data, and operational authority from collapsing into one spreadsheet whose filename carries more meaning than the system can actually verify.",
      "A simpler alternative stores one mutable workbook and treats it as schema, data, and interface. That approach is easy to explain at first and can suit a single trusted editor. It becomes brittle when templates evolve, downloads circulate, or two edits compete. Separating the nouns adds identifiers, status transitions, and retention costs. The tradeoff is worthwhile only when the product uses those distinctions consistently; four labels without enforced lifecycle rules merely rename the original ambiguity and burden users with jargon.",
      "The vocabulary does not solve spreadsheet safety by itself. JSON Schema can constrain shape, yet formulas, macros, locale-sensitive values, and cross-sheet meaning may require additional handling. An immutable Current file can still contain incorrect business data, and a valid Template can still confuse operators. Authority means the system can identify the selected version, not that every cell is true. Validation claims should name the schema revision, semantic checks, supported workbook features, and the human decisions that remain outside automated proof.",
      "Verification should create two schema revisions, two candidate workbooks, and a stale download using synthetic records. Confirm that changing a Template does not mutate Records, importing does not automatically select Current, and an inconsistent pointer or checksum blocks download instead of reconstructing a plausible substitute. Exercise concurrent selection, rollback, and deletion rules. Then ask a reviewer to identify each noun from the interface alone. A technically correct model that users cannot distinguish will still produce operational mistakes at the boundary.",
      "This entry is original Cumulus lab analysis around the invented Lantern service. It contains no nonpublic project source, workbook, schema, or operational state, and it makes no claim that a named platform implements or has verified this four-noun model. The public references support general schema and product concepts only. Assessing a real system would require accessible implementation, migration rules, storage evidence, and executable tests; the vocabulary does not establish data correctness, authorization, backup completeness, or production readiness."
    ]
  },
  "preview-before-mutation": {
    headings: [
      "Preview must be a read-only computation",
      "Bind approval to one candidate",
      "Make destructive modes unmistakable"
    ],
    paragraphs: [
      "Suppose a fictional registry accepts a workbook containing sixty synthetic suppliers. Preview parses the file, evaluates the current schema, and reports fifty additions, eight updates, and two removals without changing stored records. The response identifies the file digest, import mode, register revision, and dependencies used for the calculation. The operator can inspect consequences before granting effect authority. This is stronger than a browser confirmation assembled from guesses because the same server rules that understand the mutation also describe its candidate result.",
      "Approval should name exactly what was reviewed. In the example, a receipt binds the digest, mode, schema revision, register revision, dependency versions, actor, and short expiry. If another operator edits the register before Apply, the precondition fails and a new Preview is required. HTTP conditional semantics offer a useful public vocabulary for acting only when selected state still matches. The receipt does not authorize a filename, session, or approximate intention; it authorizes one candidate against one observed state.",
      "Requiring a fresh preview creates friction, especially for large files or frequently changing registers. One alternative recalculates automatically at Apply and asks for generic permission to accept any resulting differences. That keeps work moving but transfers material judgment from the operator to software after consent. A better compromise can cache deterministic preview artifacts and make refresh fast, while still invalidating approval when meaning changes. Performance work should reduce the cost of renewed consent rather than broaden what an old decision silently covers.",
      "Import modes need names that expose deletion behavior. Merge might retain records omitted from the file, while Replace might remove them; neither word is sufficient without a concrete preview of affected identities. Exact destructive confirmation can slow expert operators, but it protects against mode persistence and accidental defaults. The limit is that preview cannot predict external side effects it does not model, such as downstream notifications or integration jobs. Those effects must be listed, staged, or separately approved if Apply triggers them.",
      "Verification should change each bound input independently after approval: one file byte, the selected mode, schema revision, register revision, dependency, actor, and expiry time. Every change must reject Apply without partial mutation. Test that Preview itself writes nothing, including hidden counters that affect business state. For success, compare the committed result to the reviewed plan and record one idempotent outcome. Race two valid receipts to ensure concurrency does not turn individually safe previews into a combined, unreviewed state.",
      "This is original Cumulus lab analysis using a synthetic registry and workbook. It exposes no nonpublic project source, record, or implementation detail and makes no assertion that any named platform provides or has tested these preview semantics. Public HTTP concepts ground conditional application, not product status. Real assurance would require accessible route behavior, transaction boundaries, dependency definitions, audit evidence, and adversarial tests. Preview reduces mutation ambiguity; it does not establish data quality, complete side-effect modeling, authorization correctness, or production safety."
    ]
  },
  "file-link-is-not-authorization": {
    headings: [
      "Visibility and download are separate decisions",
      "Evaluate authority at request time",
      "Debug without disclosing the object"
    ],
    paragraphs: [
      "Imagine a synthetic tenant portal where a user may see that a quarterly report exists but lacks permission to download its attachment. Rendering the report title answers an entity-visibility question; delivering bytes answers a file-access question. Attribute-based access control provides a useful lens: evaluate subject, object, requested operation, and relevant environment against policy. A surrounding card, guessed identifier, or copied link is merely context. None of them proves that the current requester may receive the protected object.",
      "A server-mediated request can derive identity and tenant membership from the authenticated session, load the target object's attributes, and evaluate the download operation immediately before delivery. The browser receives neither a master storage credential nor an enduring path that bypasses policy. A short-lived signed location may still be appropriate after authorization, but its audience, object, expiry, and reuse rules become part of the grant. Convenience links should transport a request, not carry unexplained ambient authority across accounts or time.",
      "Direct object-store links can reduce server load and simplify large transfers. The tradeoff is moving enforcement into signature issuance and storage configuration, where revocation, caching, and leakage behavior may be harder to reason about. Proxying every byte centralizes checks but increases bandwidth cost and failure surface. A hybrid can authorize through the application and issue narrowly scoped delivery tokens. Whichever topology is chosen, tests must prove the same policy rather than assuming one network hop or private bucket setting supplies authorization automatically.",
      "Separation also clarifies limits. Correct download authorization does not prove that the file is malware-free, that its contents are accurate, or that every cached copy disappears after revocation. Record-level access may change while a previously authorized transfer is in progress. The policy must define those timing semantics and the acceptable exposure window. It should distinguish confidentiality from integrity and availability, and avoid claiming tenant isolation from a single route when previews, exports, search indexes, and support tools expose related data.",
      "Verification should build a matrix of synthetic users, tenants, relationships, files, operations, and session states. Exercise visible-but-not-downloadable records, expired relationships, copied links, changed tenancy, concurrent revocation, range requests, and cache behavior. Assert both response and absence of storage-side disclosure. Logs should retain a safe decision identifier and reason class without object keys or content. Test direct storage access separately, because a perfect application denial is irrelevant if credentials or bucket policy expose the same bytes elsewhere.",
      "This entry is original Cumulus lab analysis about an invented portal. It includes no private link, storage location, customer fact, or nonpublic project source, and it makes no claim that a named platform implements or has verified this authorization design. Public ABAC guidance supports the general decision model only. Evaluating a real service would require every delivery path, session and token lifecycle, storage policy, cache behavior, and operational evidence; the pattern does not establish compliance, complete tenant isolation, or production security."
    ]
  },
  "complete-backup-needs-objects": {
    headings: [
      "Inventory every recovery asset",
      "Restore into isolation before trust",
      "Scope the evidence to one drill"
    ],
    paragraphs: [
      "Consider a fictional records service whose database stores users, grants, revisions, and object identifiers while uploaded workbooks live in separate object storage. A nightly database snapshot can succeed even when the corresponding objects are missing or older. A complete recovery inventory therefore pairs both asset classes under one recovery point and records their integrity evidence. Contingency planning begins with understanding which resources support the operation; a green status for one convenient subsystem cannot stand in for recoverability of the whole product state.",
      "In a synthetic drill, the team restores a database snapshot and an object manifest into an isolated environment. It verifies schema state, follows selected pointers, checks that referenced objects exist, compares checksums, and samples application reads without touching the live target. One orphaned object is recorded as a defect rather than silently ignored because most records work. Isolation converts restoration assumptions into testable behavior and prevents a proof exercise from becoming the outage it was meant to prepare the organization to handle.",
      "One alternative is provider-managed point-in-time recovery for both services. Managed tooling can reduce operational burden, but separate retention windows, regions, credentials, and deletion semantics may still prevent a coherent restore. Exporting everything into one archive improves portability while adding transfer time, encryption, and custody obligations. The architecture should choose based on recovery objectives and threat scenarios, then test the chosen procedure. A vendor label is not evidence that application-level references and object contents return to the same logical moment.",
      "Backup completeness has limits beyond asset presence. Encrypted objects may be useless without recoverable keys; restored identities may depend on an external provider; queues and webhooks may replay old effects. A successful isolated read does not prove the promised recovery time or every tenant's data. Recovery-point and recovery-time objectives need measurement, ownership, and exceptions. The drill should state what was excluded, which steps were manual, and whether network, provider, and key dependencies were simulated rather than folding them into a broad resilient claim.",
      "Verification should delete one synthetic object, corrupt another, alter a database pointer, withhold a key, and age one asset beyond the intended recovery point. Each fault must surface before promotion. Rehearse restore ordering, least-privilege access, integrity comparison, application validation, and cleanup of the isolated target. Record durations and operator decisions without copying sensitive data into reports. Repeat periodically with a new archive; last quarter's successful drill cannot prove that current backup jobs, credentials, schemas, or provider behavior still support recovery.",
      "This essay is original Cumulus lab analysis around a fictional service and recovery drill. It publishes no backup inventory, provider account, private object, or nonpublic project source, and it makes no assertion that a named platform has completed this procedure. Public contingency-planning guidance supplies general framing only. Real readiness would require current objectives, complete dependency inventory, protected archives and keys, repeated restore evidence, and owner approval. Pairing database and object assets is necessary for this scenario, not proof of comprehensive disaster recovery."
    ]
  },
  "writing-from-verifiable-boundaries": {
    headings: [
      "Separate evidence classes before drafting",
      "Let missing proof constrain the prose",
      "Attach claims to precise subjects"
    ],
    paragraphs: [
      "Imagine an editor reviewing a local prototype, a repository page, and a deployment screenshot. Each artifact answers a different question. The checkout may support an architecture explanation; public repository visibility determines whether readers can inspect source; a deployment record may connect one candidate to one environment. None inherits authority from the others. Before drafting, the editor creates evidence columns for local behavior, public reachability, licensing, release identity, and operations, then writes each sentence only as far as its supporting column allows.",
      "A synthetic example shows the difference. A local test demonstrates that a parser rejects malformed input, but the repository is not publicly accessible and no released artifact is identified. The article can explain the parser pattern as original analysis and state the test's narrow result if disclosure is authorized. It cannot invite readers to inspect code, call the project open source, or imply deployment. GitHub's visibility categories are access facts, while licensing and release status are separate questions requiring their own current evidence.",
      "This discipline can make writing less dramatic. Marketing language prefers one adjective such as secure or production-ready, while evidence often supports a longer, conditional sentence. The alternative is to omit uncertain topics entirely, which can hide useful lessons. Boundary-aware writing offers a middle path: publish original diagrams and synthetic examples, name exclusions, and reserve stronger claims for later updates. The cost is editorial maintenance because drift-prone links, versions, and environments must be rechecked whenever the article presents them as current.",
      "Absence is meaningful but easy to overread. No public repository means no public source proof; it does not prove that source does not exist. A missing license blocks an invitation to reuse code, not the author's ability to publish original commentary. A failed public link check says what an anonymous reader observed at that time, not why access was unavailable. Careful prose reports the observation and its consequence for the article without inventing intent, ownership disputes, security posture, or future publication plans.",
      "Verification should trace every consequential adjective and backlink to a dated source or remove it. Test links from an anonymous session, distinguish profile pages from project repositories, inspect licensing at the exact referenced revision, and connect release statements to immutable candidate identities. Run a privacy pass over screenshots, logs, and examples. A second reviewer should try to falsify the claims using only public evidence. When evidence is expensive or unavailable, mark the statement as analysis rather than quietly converting confidence into fact.",
      "This entry is original Cumulus lab analysis and contains no nonpublic project source, repository address, or operational record. It makes no claim that any named project is public, licensed, released, deployed, or implements the synthetic examples. Public repository documentation grounds the distinction between visibility states only. Applying this method to a real article requires fresh access checks, owner-approved disclosure, license review, exact candidate evidence, and privacy screening. The method improves claim discipline; it does not certify the underlying system or publication decision."
    ]
  },
  "backlinks-that-do-not-pretend": {
    headings: [
      "A link is part of the claim",
      "Build useful paths inside the publication",
      "Use upstream references for upstream ideas"
    ],
    paragraphs: [
      "A backlink does more than decorate a sentence. It tells the reader that the destination is reachable and supports the nearby claim. Imagine an article about a private prototype whose familiar repository-shaped URL returns no content to an anonymous visitor. Publishing that URL as source evidence creates a false affordance, even if the author can open it while signed in. Repository visibility is audience-dependent, so editorial verification must use the same unauthenticated perspective available to ordinary readers at publication time.",
      "The honest alternative is not an empty article. A synthetic series can link architecture analysis to a related essay on verification, then to a glossary or methods page. These internal routes help readers follow concepts without implying source disclosure. Each destination must itself be published and checked; linking a draft creates a different broken promise. Descriptive labels should say what the reader will find, such as an adjacent analysis or author profile, rather than using Source for a page that contains only identity or a project summary.",
      "Official upstream references can ground public concepts. A Git manual may define repository behavior, a standards document may frame authorization, and accessibility guidance may explain motion controls. Those links support the concept attributed to the upstream source; they do not prove that a private derivative implements it. This distinction lets an article remain useful without laundering documentation into implementation evidence. If the prose crosses from how a standard works to what a product does, a separate product-specific and publicly inspectable source is required.",
      "Link stability and privacy create tradeoffs. Permanent references improve reproducibility, while living documentation may better reflect current guidance. Archived snapshots can preserve context but may carry licensing or availability constraints. Tracking parameters, authenticated dashboards, and copied support links can disclose internal state or fail for readers. A publication can record verification dates and prefer canonical public pages, then schedule link checks. No automation can decide whether a surviving page still supports the claim after its content changes; editorial review remains necessary.",
      "Verification should crawl every public route, reject drafts from related-content selectors, and check external links without credentials. Then a reviewer opens each destination and answers two questions: does it resolve, and does it substantiate the exact nearby wording? Test redirects, fragments, mobile behavior, and error pages. Maintain a small allowlist of intentional external domains if appropriate, but do not treat allowlisting as endorsement. When a repository later changes visibility, recheck access, license, sensitive history, and the specific revision before adding a source link.",
      "This essay is original Cumulus lab analysis using hypothetical links and pages. It includes no private repository address or nonpublic source and makes no claim that any named project is publicly accessible or implements the discussed patterns. GitHub's public visibility documentation grounds only the access distinction. Real backlink approval would require fresh anonymous verification, content and license review, owner authorization, and claim-by-claim relevance checks. A truthful link graph improves navigation and evidence hygiene; it does not make private implementation facts publishable."
    ]
  },
  "dither-as-editorial-grammar": {
    headings: [
      "Give texture an editorial role",
      "Start with the still composition",
      "Repeat rules rather than decoration"
    ],
    paragraphs: [
      "Imagine a black editorial page where a dense dither field marks the lead story, a sparse band separates sections, and a small orange interruption marks current state. Texture is performing grammar: density signals hierarchy, edges mark transitions, and open space controls pace. The article title, category, and status remain ordinary text, so readers do not need to decode the pattern. When every card receives identical noise, the grammar disappears; decoration becomes a uniform tax on contrast, rendering, and attention.",
      "A synthetic post system can assign each story one named visual variant and a concise alternative description. The same component renders a static pattern first, then optionally adds restrained motion when capability and preference allow. The written article remains complete if graphics fail. This ordering makes accessibility and performance part of composition rather than cleanup. W3C guidance on interaction-triggered animation reinforces user control over nonessential motion; a dither effect should never trap essential meaning inside movement that cannot be disabled.",
      "The alternative is bespoke art for every page. Unique illustration can create stronger individual character, but it increases production cost and weakens recognition across a publication. A strict component library is cheaper and coherent, yet risks monotony. Controlled variation offers a middle path: reuse a small set of densities, masks, edges, and timing rules while changing composition according to editorial placement. The system should specify when texture is absent too, because quiet pages and long reading passages need visual rest to preserve hierarchy.",
      "Dither also has technical limits. Fine patterns can shimmer during scrolling, collapse under compression, trigger expensive shader work, or reduce text legibility when placed behind copy. Reduced motion does not address contrast, cognitive load, or battery consumption. A static fallback can still be noisy. Designers should separate media layers from text, cap pixel density and animation rate, pause work outside the viewport, and verify forced-colors and zoom states. Brand consistency is not permission to override readable content or device constraints.",
      "Verification begins with the static page at narrow and wide widths, high zoom, reduced motion, forced colors, and disabled graphics. Confirm that headings and links retain meaning without the visual layer and that alternative descriptions explain function rather than pixel appearance. Profile animation cost on representative devices and watch for layout shift. Compare variants together to ensure density communicates distinct roles. Finally, test whether orange marks actual action or state consistently; an accent that sometimes means decoration cannot function as dependable grammar.",
      "This entry is original Cumulus lab design analysis using an invented visual system. It contains no nonpublic design file, screenshot, or project source and makes no claim that a named site implements or has verified these dither behaviors. Public accessibility guidance supports the motion-control principle only. Evaluating a real interface would require rendered states, assistive-technology review, contrast measurements, motion and performance profiling, and user testing. Editorial grammar can organize attention; it does not by itself establish accessibility, usability, or brand effectiveness."
    ]
  },
  "completion-is-a-proof-obligation": {
    headings: [
      "Turn requirements into evidence rows",
      "Keep unavailable checks visibly open",
      "Close against the original request"
    ],
    paragraphs: [
      "Suppose a fictional launch request asks for eight pages, responsive navigation, account notifications, safe public content, and deployment on an existing domain. A successful build answers only whether the code compiles. The team creates an evidence table mapping each requirement to inspection, focused tests, browser runs, security checks, or external provider evidence. Each row names the candidate and environment. Completion becomes the result of closing all required rows, not the emotional moment when the interface first looks finished on one laptop.",
      "Different evidence types should remain narrow. A unit test can protect notification state transitions but cannot prove email delivery. A browser capture can reveal overflow but cannot prove keyboard order across every route. A provider dashboard may confirm a domain mapping without showing that the deployed artifact matches reviewed source. Supply-chain frameworks such as SLSA offer public vocabulary for provenance and build integrity, yet they do not replace product acceptance. The matrix records these boundaries so one impressive artifact cannot absorb unrelated claims.",
      "Sometimes a required check is impossible in the current environment. Missing credentials, an unavailable target host, or an owner-only provider step leaves a gate open. The local candidate may still be ready for that next action, but the broader launch is not complete. One alternative marks the check skipped and lets the pipeline pass, which improves throughput while weakening the meaning of green. A fail-closed status is more honest: it records useful completed work and preserves the exact missing authority or evidence.",
      "Proof obligations can become bureaucratic if every cosmetic detail receives the same ceremony as data loss or publication. Risk-based depth is the alternative: keep every requirement represented, but match verification strength to consequence and determinism. Automated checks suit repeatable rules; human review suits tone and visual judgment; external observations suit deployment state. The limit is that a checklist can still miss misunderstood intent. Reviewers must compare evidence with the user's actual outcome, not merely celebrate that all internally invented rows are green.",
      "Final verification should restart from the original request and traverse each page, link, responsive state, notification transition, public-safety boundary, and deployment claim against the current candidate. Re-run checks after late fixes, because evidence attached to an earlier artifact has expired. Search for skipped tests, ignored records, placeholder content, and unreported manual steps. Ask what a user can do now, what an operator must still configure, and what remains unverified. Completion is defensible only when those answers match the stated scope without hidden exceptions.",
      "This essay is original Cumulus lab analysis around a hypothetical launch. It contains no private source, deployment record, account state, or project evidence and makes no claim that any named system has completed these gates. Public supply-chain guidance grounds general provenance concepts only. A real completion statement would require the authoritative request, exact candidate identity, current test and rendered evidence, external-state verification, and owner decisions. The proof-obligation method improves reporting discipline; it does not guarantee flawless requirements, exhaustive testing, or future operational reliability."
    ]
  },
};

const FOUR_SECTION_SLUGS = new Set([
  "trust-root-before-product-surface",
  "assembly-makes-assumptions-visible",
  "one-budget-equation-every-backend",
  "control-plane-you-can-read",
  "four-nouns-for-live-workbooks",
  "writing-from-verifiable-boundaries",
]);

const FIVE_SECTION_SLUGS = new Set([
  "three-boundaries-one-workflow",
  "envelope-encryption-as-protocol",
  "reproducible-builds-evidence-contract",
  "parse-completely-publish-once",
  "repository-context-is-capability",
  "no-silent-local-to-remote",
  "save-is-not-run",
  "preview-before-mutation",
  "backlinks-that-do-not-pretend",
]);

function supplementalSections(post: Post): readonly PostBodySection[] {
  const note = DEPTH_NOTES[post.slug];
  if (!note) return [];

  if (FOUR_SECTION_SLUGS.has(post.slug)) {
    return [{ heading: note.headings[0], paragraphs: note.paragraphs }];
  }

  if (FIVE_SECTION_SLUGS.has(post.slug)) {
    return [
      { heading: note.headings[0], paragraphs: note.paragraphs.slice(0, 3) },
      { heading: note.headings[1], paragraphs: note.paragraphs.slice(3, 6) },
    ];
  }

  return note.headings.map((heading, index) => ({
    heading,
    paragraphs: note.paragraphs.slice(index * 2, index * 2 + 2),
  }));
}

export function countBodyWords(body: readonly PostBodySection[]): number {
  return body.reduce(
    (total, bodySection) =>
      total +
      bodySection.paragraphs.reduce(
        (sectionTotal, paragraph) =>
          sectionTotal + paragraph.trim().split(/\s+/).filter(Boolean).length,
        0,
      ),
    0,
  );
}

export function calculateReadingTime(body: readonly PostBodySection[]): number {
  return Math.max(1, Math.ceil(countBodyWords(body) / 220));
}

export const POSTS: readonly Post[] = BASE_POSTS.map((post) => {
  const body = [...post.body, ...supplementalSections(post)];
  return { ...post, body, readingTime: calculateReadingTime(body) };
});

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      url.hostname !== "localhost" &&
      url.hostname !== "127.0.0.1" &&
      url.hostname !== "::1"
    );
  } catch {
    return false;
  }
}

/** Returns editorial validation issues; an empty array means the catalog is valid. */
export function validatePosts(posts: readonly Post[] = POSTS): string[] {
  const issues: string[] = [];
  const slugs = new Set<string>();
  const publishedSlugs = new Set(
    posts.filter((post) => post.status === "published").map((post) => post.slug),
  );

  if (publishedSlugs.size < 20) {
    issues.push(`Expected at least 20 published posts, received ${publishedSlugs.size}.`);
  }

  posts.forEach((post, index) => {
    const label = post.slug || `post at index ${index}`;

    if (!SLUG_PATTERN.test(post.slug)) {
      issues.push(`${label}: slug must use lowercase kebab case.`);
    }
    if (slugs.has(post.slug)) issues.push(`${label}: slug must be unique.`);
    slugs.add(post.slug);

    if (!post.title.trim()) issues.push(`${label}: title is required.`);
    if (!post.excerpt.trim()) issues.push(`${label}: excerpt is required.`);
    if (!isValidDate(post.date)) {
      issues.push(`${label}: date must be a valid YYYY-MM-DD value.`);
    }
    if (!post.category.trim()) issues.push(`${label}: category is required.`);
    const expectedReadingTime = calculateReadingTime(post.body);
    if (
      !Number.isInteger(post.readingTime) ||
      Math.abs(post.readingTime - expectedReadingTime) > 1
    ) {
      issues.push(`${label}: readingTime must track body length at roughly 220 wpm.`);
    }
    if (post.tags.length < 2 || post.tags.some((tag) => !tag.trim())) {
      issues.push(`${label}: at least two non-empty tags are required.`);
    }
    if (new Set(post.tags.map(normalized)).size !== post.tags.length) {
      issues.push(`${label}: tags must be unique within a post.`);
    }
    if (!post.visual.variant || !post.visual.alt.trim()) {
      issues.push(`${label}: visual variant and alternative text are required.`);
    }
    if (post.body.length < 3 || post.body.length > 6) {
      issues.push(`${label}: body must contain between three and six sections.`);
    }
    if (post.status === "published" && countBodyWords(post.body) < 600) {
      issues.push(`${label}: published body must contain at least 600 words.`);
    }
    post.body.forEach((bodySection, sectionIndex) => {
      if (!bodySection.heading.trim()) {
        issues.push(`${label}: body section ${sectionIndex + 1} needs a heading.`);
      }
      if (
        bodySection.paragraphs.length < 2 ||
        bodySection.paragraphs.some((paragraph) => paragraph.trim().length < 80)
      ) {
        issues.push(
          `${label}: body section ${sectionIndex + 1} needs two substantial paragraphs.`,
        );
      }
    });

    const sourceKeys = new Set<string>();
    for (const source of post.sourceLinks ?? []) {
      const key = `${normalized(source.label)}\n${source.href}`;
      if (!source.label.trim() || !isSafeHttpsUrl(source.href)) {
        issues.push(`${label}: source links need a label and a safe HTTPS URL.`);
      }
      if (sourceKeys.has(key)) issues.push(`${label}: source links must be unique.`);
      sourceKeys.add(key);
    }

    const related = post.relatedSlugs ?? [];
    if (post.status === "published" && related.length < 2) {
      issues.push(`${label}: published posts need at least two related backlinks.`);
    }
    if (new Set(related).size !== related.length) {
      issues.push(`${label}: related slugs must be unique.`);
    }
    for (const relatedSlug of related) {
      if (relatedSlug === post.slug) {
        issues.push(`${label}: a post cannot relate to itself.`);
      } else if (!publishedSlugs.has(relatedSlug)) {
        issues.push(`${label}: related slug ${relatedSlug} must resolve to a published post.`);
      }
    }

    if (post.status === "published" && !post.verifiedAt) {
      issues.push(`${label}: published posts need a verifiedAt date.`);
    } else if (post.verifiedAt && !isValidDate(post.verifiedAt)) {
      issues.push(`${label}: verifiedAt must be a valid YYYY-MM-DD value.`);
    }

    if (index > 0 && posts[index - 1].date < post.date) {
      issues.push(`${label}: posts must be in non-increasing date order.`);
    }
  });

  if (!posts.some((post) => post.status === "draft")) {
    issues.push("At least one draft post is required to verify draft isolation.");
  }

  return issues;
}

export const publishedPosts: readonly Post[] = POSTS.filter(
  (post) => post.status === "published",
);

export const featuredPost: Post = publishedPosts.find(
  (post) => post.placement === "featured",
)!;

export function getPublishedPostBySlug(slug: string): Post | undefined {
  const normalizedSlug = normalized(slug);
  return publishedPosts.find((post) => post.slug === normalizedSlug);
}

export function searchPublishedPosts(
  query = "",
  category?: string,
): readonly Post[] {
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  const normalizedCategory = normalized(category ?? "all");

  return publishedPosts.filter((post) => {
    const categoryMatches =
      !normalizedCategory ||
      normalizedCategory === "all" ||
      normalized(post.category) === normalizedCategory;
    if (!categoryMatches) return false;
    if (terms.length === 0) return true;

    const searchableText = normalized(
      [
        post.title,
        post.excerpt,
        post.category,
        post.project ?? "",
        ...post.tags,
        ...post.body.flatMap((bodySection) => [
          bodySection.heading,
          ...bodySection.paragraphs,
        ]),
      ].join(" "),
    );
    return terms.every((term) => searchableText.includes(term));
  });
}
