export interface WorkProject {
  description: string;
  domain: string;
  latestWork: string;
  name: string;
  slug: string;
  source?: {
    href: string;
    label: string;
  };
  sourceBoundary: string;
  stack: readonly string[];
  status: string;
}

export const WORK_PROJECTS: readonly WorkProject[] = [
  {
    slug: "cumulus",
    name: "Cumulus",
    description:
      "An editorial engineering log and public lab for product, systems, and infrastructure work, expressed through a Jacquard-and-dither design system.",
    latestWork:
      "The current release brings together the responsive dither redesign, interactive contribution field, twenty-four source-backed logs, static route output, and signed notification-webhook handling. The controlled email receipt, unsubscribe, and suppression lifecycle remains a separate final verification gate.",
    status: "Live; notification lifecycle verification in progress",
    domain: "Editorial engineering / public lab",
    stack: ["React", "Vite", "TypeScript", "Supabase", "Resend", "Vercel", "WebGL + CSS dither"],
    sourceBoundary: "Public source is available at the exact reviewed snapshot.",
    source: {
      label: "View source",
      href: "https://github.com/ocque41/cumulus/tree/0894901461287ae66431458483d5322554d0b04d",
    },
  },
  {
    slug: "room",
    name: "Room",
    description:
      "Tenant-scoped acquisition infrastructure combining a seller-controlled data room, a buyer command workspace, controlled disclosure, audit, permission-safe search, and governed AI behind a compact trust root.",
    latestWork:
      "The latest candidate completes the local and reference roadmap with immutable release packaging, private runtime and frontend boundaries, durable search reconciliation, recovery tooling, and fail-closed activation gates. Production activation, external review, and real pilot evidence remain deliberately separate.",
    status: "Pre-production candidate; no deployment claim",
    domain: "Acquisition infrastructure / controlled diligence",
    stack: ["Rust", "Go", "React + Vite", "gRPC", "Protobuf", "PostgreSQL", "Infrastructure as code"],
    sourceBoundary: "Private source. This page describes only the public-safe product boundary and verified readiness state.",
  },
  {
    slug: "requisia",
    name: "Requisia",
    description:
      "Enterprise procurement operations built around organization-scoped registers, Excel round-tripping, private document delivery, and isolated client and vendor portals.",
    latestWork:
      "Recent work deepened module and workbook flows, portal isolation, billing, support, export, and verified-deletion operations, followed by a focused marketing hero and navigation refinement. The remaining workbook depth, operational coverage, and distribution roadmap is still active.",
    status: "Active private development",
    domain: "Procurement operations / enterprise workbooks",
    stack: ["Next.js", "TypeScript", "Drizzle", "libSQL + PostgreSQL", "Private object storage", "Resend", "Stripe", "Excel tooling"],
    sourceBoundary: "Private source. Cumulus publishes the product narrative without exposing repository access or private operating details.",
  },
  {
    slug: "hyoka-hanesu",
    name: "Hyoka Hanesu",
    description:
      "A local-first repository assistant with a C17 terminal interface, strict context budgeting, opt-in repository access, Apple Foundation Models, and an OpenAI-compatible service boundary.",
    latestWork:
      "The latest committed work adds configurable local container provisioning and deterministic saved tools. A new terminal frontend, bounded versioned bridge protocol, runtime reducer, and protocol fuzzing layer are currently evolving locally and are not presented as a finished release.",
    status: "Local release candidate; frontend evolution in progress",
    domain: "Local AI tooling / repository assistance",
    stack: ["C17", "ncurses", "Swift", "Apple Foundation Models", "libcurl", "HTTP + SSE", "TypeScript", "Apple containers"],
    sourceBoundary: "Private source. Unsigned and unnotarized release state is preserved as an explicit limitation.",
  },
  {
    slug: "gy",
    name: "gy",
    description:
      "An assembly-only x86-64 Linux Git and forge prototype designed around bounded parsing, Git interoperability, reproducible evidence, and two first-class clients.",
    latestWork:
      "Recent phases landed crash-aware global installation and installed-runtime validation. Automatic Git configuration lookup and bounded typed parsing for integers, colors, and expiry values are the current focus; no strict independently reviewed release profile is claimed to pass yet.",
    status: "Research prototype; zero strict reviewed profiles pass",
    domain: "Git implementation / self-hosted forge research",
    stack: ["x86-64 Linux assembly", "Make", "POSIX test tooling", "Static web assets", "Git wire formats"],
    sourceBoundary: "Private source. The zero-pass qualification is intentionally visible rather than softened into a release claim.",
  },
  {
    slug: "toml-agent",
    name: "TOML Agent",
    description:
      "A local control surface for Codex multi-agent work, driven by one strict manifest and presented through native macOS and terminal interfaces.",
    latestWork:
      "The local candidate combines a Swift editor, Rust terminal controller, private Unix-socket App Server integration, Apple-container split mode, and clean-room candidate packaging. It remains uncommitted and unpublished, with authenticated and manual release gates still pending.",
    status: "Unpublished local candidate",
    domain: "Agent orchestration / local developer tooling",
    stack: ["Rust", "Ratatui", "SwiftUI + AppKit", "JSON-RPC + JSONL", "Unix sockets", "Codex App Server", "Alpine containers"],
    sourceBoundary: "Unpublished local work. No source link exists until a reviewed repository is committed and intentionally made public.",
  },
  {
    slug: "nido",
    name: "Nido",
    description:
      "A Spanish-first nonprofit platform that connects people seeking emotional support with verified volunteer mental-health professionals while collecting as little sensitive data as possible.",
    latestWork:
      "The latest public work hardens account deletion and local state hydration after adding contact, outreach, privacy-conscious chat, retention, and coordinator workflows. The service keeps its non-emergency boundary explicit throughout the experience.",
    status: "Active public project; not an emergency service",
    domain: "Mental-health access / volunteer coordination",
    stack: ["Next.js", "React", "TypeScript", "Cloudflare Workers", "D1", "Durable Objects", "Drizzle", "Better Auth", "Resend"],
    sourceBoundary: "Public source is available at the exact reviewed snapshot.",
    source: {
      label: "View source",
      href: "https://github.com/ocque41/psicoayuda/tree/13bd5fe471e8be651a6782560a88349741274caa",
    },
  },
  {
    slug: "relay",
    name: "Cumulus Relay",
    description:
      "An agent signup, authentication, and action stack with hosted and self-hosted paths across REST, OpenAPI, and MCP.",
    latestWork:
      "The latest public snapshot improves generated local-database setup and dashboard behavior. The wider system joins durable signup workflows, discovery metadata, API contracts, and tenant-owned provider webhooks without collapsing their authority boundaries.",
    status: "Public open-source project",
    domain: "Agent identity / API orchestration",
    stack: ["TypeScript", "Next.js", "Hono", "OpenAPI", "MCP", "PostgreSQL", "Vercel Workflow"],
    sourceBoundary: "Public source is available at the exact reviewed snapshot.",
    source: {
      label: "View source",
      href: "https://github.com/ocque41/relay/tree/5f8f116bb1cd82db789e165c2e22bd5566cfe952",
    },
  },
  {
    slug: "rune",
    name: "Rune",
    description:
      "A workflow command deck for building, inspecting, simulating, and running node-based automations with bring-your-own provider keys.",
    latestWork:
      "The newest public work adds authentication fallback routes around an encrypted, server-controlled secret model. Workflow validation, simulation, scheduled execution, and approval policy remain distinct stages so previewing a graph cannot silently become an external side effect.",
    status: "Public product source",
    domain: "Workflow automation",
    stack: ["TypeScript", "Next.js", "Supabase", "Encrypted server-side secrets", "Scheduled + webhook execution"],
    sourceBoundary: "Public source is available at the exact reviewed snapshot.",
    source: {
      label: "View source",
      href: "https://github.com/ocque41/rune/tree/d0a73dd0fa99c7a001eea954e7066ec32a4416b7",
    },
  },
  {
    slug: "cmls-skills",
    name: "CMLs Skills",
    description:
      "Curated Codex skills, agents, and reusable goal-loop packages for wireframe-first planning and evidence-driven completion.",
    latestWork:
      "The current public package combines Diffs and Goal Triad bundles, dry-run installation, preservation safeguards, and objective-lock tooling. It turns planning, parallel ownership, validation, and completion evidence into reusable project-local operating structures.",
    status: "Public released package",
    domain: "Agent workflows / reusable developer tooling",
    stack: ["Node.js ESM", "Python helpers", "TOML agent definitions", "Codex skill packages", "Markdown references"],
    sourceBoundary: "Public source is available at the exact reviewed snapshot.",
    source: {
      label: "View source",
      href: "https://github.com/ocque41/skills/tree/724413ac4ffaa5abddc8ba7a6342c8f9c86cce92",
    },
  },
];

export const PUBLIC_WORK_COUNT = WORK_PROJECTS.filter((project) => project.source).length;
