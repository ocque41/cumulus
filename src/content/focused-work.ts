export interface WorkProject {
  description: string;
  domain: string;
  latestWork: string;
  name: string;
  slug: "requisia" | "insuja" | "hyoka-hanesu" | "gy";
  sourceBoundary: string;
  stack: readonly string[];
  status: string;
  verifiedAt: string;
}

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    slug: "requisia",
    name: "Requisia",
    description:
      "A first-party procurement-operations project organized around durable registers, deliberate spreadsheet round-tripping, private document delivery, and separate internal, client, and vendor responsibilities.",
    latestWork:
      "The current journal concentrates on how a register remains authoritative while people work through both browser interfaces and familiar workbook tools. It also records the boundaries that still need deployment, recovery, and representative-user evidence before any production-readiness claim would be justified.",
    status: "Active first-party development; production use is not asserted",
    verifiedAt: "2026-07-17",
    domain: "Procurement operations / enterprise workbooks",
    stack: [
      "TypeScript",
      "React application interfaces",
      "Relational data",
      "Private object storage",
      "Email delivery",
      "Workbook tooling",
    ],
    sourceBoundary:
      "These notes are maintainer-authored summaries of private development. They publish product reasoning and limits, not repository access, provider configuration, customer evidence, deployment proof, or a security certification.",
  },
  {
    slug: "insuja",
    name: "Insuja",
    description:
      "A first-party controlled-diligence project exploring distinct seller, buyer, and shared-workflow boundaries, revocable authorization, explicit disclosure, permission-aware discovery, and audit-oriented operations.",
    latestWork:
      "The current journal follows the path from private workspace state to deliberately shared deal activity, with particular attention to search reconciliation and revocation. Local implementation observations are separated from the unproven organization bootstrap, deployment, recovery, and external-review gates.",
    status: "Pre-production first-party system; activation evidence remains open",
    verifiedAt: "2026-07-17",
    domain: "Acquisition infrastructure / controlled diligence",
    stack: [
      "Rust services",
      "Go services",
      "React interfaces",
      "Typed service contracts",
      "Relational data",
      "Infrastructure as code",
    ],
    sourceBoundary:
      "Cumulus exposes only a public-safe first-party architecture journal. Private source, tenant information, credentials, infrastructure identity, provider state, and operational evidence remain outside this repository.",
  },
  {
    slug: "hyoka-hanesu",
    name: "Hyoka Hanesu",
    description:
      "A first-party local repository assistant exploring an explicit permission boundary for project access, bounded context assembly, a terminal-oriented interface, and clearly separated local and service-backed model paths.",
    latestWork:
      "The journal is currently focused on the shape of a predictable local session: what the assistant may read, how much context it may carry, how tools become visible, and how interface state survives backend changes. It does not present an unpublished local candidate as a distributed or notarized release.",
    status: "Local development journal; no public release claim",
    verifiedAt: "2026-07-17",
    domain: "Local AI tooling / repository assistance",
    stack: [
      "C17 terminal code",
      "Swift integration",
      "Apple Foundation Models",
      "OpenAI-compatible HTTP",
      "Streaming events",
      "Local container tooling",
    ],
    sourceBoundary:
      "The project source and release evidence are private. Published notes describe maintainer intent, observed local design constraints, and open verification work without exposing local paths, prompts, credentials, or repository contents.",
  },
  {
    slug: "gy",
    name: "gy",
    description:
      "A first-party research prototype investigating how much Git and forge behavior can be expressed in x86-64 Linux assembly while keeping parsing bounds, interoperability, and qualification evidence explicit.",
    latestWork:
      "The journal examines installed-runtime behavior, configuration parsing, and the difference between a promising prototype and a qualified release. Passing local examples remain narrower than interoperability, hostile-input, packaging, and independent-review evidence, so the public status stays deliberately conservative.",
    status: "Research prototype; no qualified release is claimed",
    verifiedAt: "2026-07-17",
    domain: "Git implementation / forge research",
    stack: [
      "x86-64 Linux assembly",
      "Make",
      "POSIX test tooling",
      "Git wire formats",
      "Static web assets",
      "Reproducible fixtures",
    ],
    sourceBoundary:
      "Cumulus publishes a first-party research narrative only. Private source, machine details, unpublished phase evidence, infrastructure values, and strict-profile results are not reproduced or promoted into a release claim.",
  },
];
