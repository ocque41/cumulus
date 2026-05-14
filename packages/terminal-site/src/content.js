export const CONTACT_EMAIL = "hi@cumulush.com";

export const pages = [
  {
    id: "home",
    title: "Cumulus",
    route: "/",
    aliases: ["/home"],
    kicker: "studio",
    summary:
      "Tools and infrastructure for people building with AI. Start a new app with create-cumulus, then use the rest of the Cumulus surfaces when the project needs them.",
    sections: [
      {
        heading: "What Cumulus is",
        body: [
          "Cumulus is a small studio shipping AI-first product surfaces. Each product can stand on its own, with its own roadmap, license, and users.",
          "The fastest way to start is the create-cumulus npm package. It scaffolds a Relay/Cumulus app with agent auth, signup flows, actions, dashboards, Cumulus DB options, and public docs.",
          "The public repo carries the parts that are safe to inspect, fork, and quote: marketing pages, public docs, auth integration, billing hooks, dashboards, tests, and the self-hosted Cumulus DB provider.",
          "The production overlay stays private. That is where real environment values, provider accounts, customer data, deployment credentials, and internal runbooks belong.",
        ],
      },
      {
        heading: "Start a project",
        code: [
          "npx create-cumulus@latest my-acme",
          "npm create cumulus@latest my-acme",
          "npx create-cumulus@latest my-acme --template full --agent-auth hosted",
        ],
      },
      {
        heading: "Operating rules",
        bullets: [
          "Open where it helps users verify and self-host.",
          "Commercial where it pays for hosted operations.",
          "Trust-first anywhere identity, credentials, or agent access appear.",
          "Plain documentation before hidden setup.",
        ],
      },
      {
        heading: "What is here",
        rows: [
          ["create-cumulus", "Scaffold a Relay/Cumulus app with templates, agent auth, actions, dashboards, and Cumulus DB modes."],
          ["Documents", "Public docs for setup, licensing, self-hosting, and release safety."],
          ["Relay", "Agent-safe onboarding for SaaS products."],
          ["Tado", "A macOS terminal multiplexer for parallel AI coding agents."],
          ["Rune", "A lightweight automation story for routing work across tools."],
          ["Contact", `A terminal contact prompt that opens a draft to ${CONTACT_EMAIL}.`],
        ],
      },
      {
        heading: "Run it",
        code: [
          "npx cumulush",
          "npx cumulush /documents",
          "npx cumulush /relay",
          "npx cumulush /contact",
        ],
      },
    ],
  },
  {
    id: "documents",
    title: "Documents",
    route: "/documents",
    aliases: ["/docs", "/documents/"],
    kicker: "create-cumulus guide",
    summary:
      "One page for installing create-cumulus, choosing a template, choosing auth and database modes, and knowing what the generated app includes.",
    sections: [
      {
        heading: "Install",
        body: [
          "create-cumulus is a public npm package. It requires Node 18 or newer and runs as a project generator.",
          "Use npx for the direct command, or npm create for the shorthand. Both run the same create-cumulus binary.",
        ],
        code: [
          "npx create-cumulus@latest my-acme",
          "npm create cumulus@latest my-acme",
          "npx create-cumulus@latest my-acme --template full --agent-auth hosted",
        ],
      },
      {
        heading: "What it creates",
        rows: [
          ["full", "Relay public site, /me, /dev, dashboards, API/MCP, docs, auth, signup, and actions."],
          ["outer", "Marketing and docs site with discovery, signup, and action bootstrap."],
          ["inner", "/me and /dev dashboards, settings, API/MCP, auth, and actions."],
          ["agent-auth", "Smallest Relay-branded starter with attestation login, signup, and actions."],
        ],
      },
      {
        heading: "Auth modes",
        rows: [
          ["hosted", "Use hosted Relay auth, signup, and action dispatch."],
          ["self-hosted", "Generate a local Relay-style API/MCP surface that the app owns."],
        ],
      },
      {
        heading: "Cumulus DB modes",
        body: [
          "Defaults matter: full, inner, and agent-auth default to both. outer defaults to cloud.",
        ],
        rows: [
          ["cloud", "Use hosted Cumulus DB through hosted Relay/Cumulus Cloud."],
          ["local", "Include the AGPL Cumulus DB service and run it locally."],
          ["both", "Include local service files and keep the hosted path documented."],
        ],
      },
      {
        heading: "Main flags",
        code: [
          "create-cumulus <project-name>",
          "  --template full|outer|inner|agent-auth",
          "  --agent-auth hosted|self-hosted",
          "  --cumulus-db cloud|local|both",
          "  --company \"Acme Inc\"",
          "  --package-manager npm|pnpm|yarn|bun",
          "  --install | --no-install",
          "  --git | --no-git",
        ],
      },
      {
        heading: "Local DB scripts",
        code: [
          "npm run cumulus-db:build",
          "npm run cumulus-db:start",
          "npm run cumulus-db:test",
          "npm run cumulus-db:smoke",
          "npm run cumulus-db:workspace",
        ],
      },
      {
        heading: "License boundary",
        bullets: [
          "The create-cumulus package is MIT-licensed.",
          "Generated full, inner, and self-hosted Relay templates are AGPL-3.0-only.",
          "outer defaults to cloud Cumulus DB and can stay MIT in hosted mode.",
          "agent-auth defaults to both Cumulus DB modes, so it includes local Cumulus DB and is AGPL unless you explicitly use --cumulus-db cloud.",
          "Generated app code talks to Cumulus DB over HTTP/token APIs. It does not import Cumulus DB source directly.",
        ],
      },
      {
        heading: "Related public docs",
        rows: [
          ["README.md", "Product overview, setup paths, commands, and repo structure."],
          ["docs/self-hosting.md", "How to run the public app and Cumulus DB yourself."],
          ["docs/licensing.md", "The Apache-2.0 and AGPL-3.0-only boundary."],
          ["docs/private-overlay.md", "What stays public and what belongs in production private config."],
          ["docs/public-release.md", "Checklist for a clean public release or export."],
          ["docs/terminal-site.md", "How to run this terminal website package."],
        ],
      },
      {
        heading: "Release safety",
        bullets: [
          "Do not publish secrets, tokens, cookies, private keys, database dumps, or user screenshots.",
          "Use placeholders such as https://your-project.supabase.co and replace-with-strong-secret.",
          "Treat every NEXT_PUBLIC value as visible to users.",
          "Run the public safety scan before release.",
        ],
      },
      {
        heading: "Useful commands",
        code: [
          "npm run lint",
          "npm run license:check",
          "npm run test",
          "npm run db:test",
          "npm run security:scan",
        ],
      },
    ],
  },
  {
    id: "relay",
    title: "Relay",
    route: "/relay",
    aliases: ["/products/relay"],
    kicker: "trust-first onboarding",
    summary:
      "Agent-safe signup for SaaS products. Providers add one signed webhook. Agents receive scoped connection handles, not raw keys.",
    sections: [
      {
        heading: "The problem",
        body: [
          "Agents can complete onboarding flows, but raw credentials do not belong in chat, logs, model context, or a pasted terminal transcript.",
          "Relay sits beside existing auth systems. It does not replace Clerk, Auth0, Supabase, or a custom login stack.",
        ],
      },
      {
        heading: "How it works",
        bullets: [
          "A provider registers one HTTPS webhook and a shared secret.",
          "Relay signs each signup event with HMAC so the provider can approve, reject, or defer.",
          "Users get a scoped alias inbox for verification codes and magic links.",
          "Relay exchanges approved credentials for revocable connection handles.",
          "Agents call tools through the handle. They never hold the raw key.",
        ],
      },
      {
        heading: "Who sees what",
        rows: [
          ["Agent", "A scoped connection_id, allowed tools, and its own audit log."],
          ["User", "Alias lifecycle, active agents, scopes, and one-click revocation."],
          ["Provider", "Approval, rate limits, webhook decisions, metering, and audit export."],
          ["Relay", "Encrypted credentials only when vaulting is enabled."],
        ],
      },
      {
        heading: "Integration shape",
        code: [
          "agent -> relay -> provider webhook",
          "agent -> relay -> scoped alias inbox",
          "provider -> relay -> connection_id",
          "user/provider -> revoke anytime",
        ],
      },
    ],
  },
  {
    id: "tado",
    title: "Tado",
    route: "/tado",
    aliases: ["/products/tado"],
    kicker: "agent terminal canvas",
    summary:
      "A macOS terminal multiplexer for AI coding agents. Run Claude Code and Codex sessions in parallel with built-in agent communication.",
    sections: [
      {
        heading: "Core idea",
        body: [
          "Tado treats terminal sessions as movable tiles on an infinite canvas, not tabs hidden in a sidebar.",
          "The loop is simple: type a task, spawn an agent tile, watch the work, coordinate with other agents, then review the result.",
        ],
      },
      {
        heading: "Surfaces",
        rows: [
          ["Canvas", "Pannable, zoomable workspace for many terminal tiles."],
          ["IPC", "Agents discover peers, read output, send messages, and publish topics."],
          ["Teams", "Named roles and coordination rules turn loose sessions into units."],
          ["Projects", "Agent definitions are scoped by codebase and auto-discovered."],
        ],
      },
      {
        heading: "Commands agents can use",
        code: [
          "tado-list",
          "tado-read <target> --tail 80",
          "tado-send <target> \"ship the fix and report back\"",
          "tado-broadcast <topic> \"schema changed\"",
          "tado-recv <topic>",
        ],
      },
      {
        heading: "Why it matters",
        bullets: [
          "Parallel agents become visible instead of scattered across windows.",
          "Peer-to-peer IPC avoids a single master orchestrator.",
          "Project zones reduce accidental cross-repo confusion.",
          "Mandatory response rules make handoffs accountable.",
        ],
      },
    ],
  },
  {
    id: "rune",
    title: "Rune",
    route: "/rune",
    aliases: ["/cumulus/rune", "/products/rune"],
    kicker: "automation engine",
    summary:
      "A terminal-sized product story for routing one event through an automated ecosystem.",
    sections: [
      {
        heading: "What Rune shows",
        body: [
          "Rune presents automation as a clear operational flow. One event enters, routing decisions happen, integrations run in parallel, logs stay visible, and a builder captures the repeatable workflow.",
          "The current product story uses a boutique order because it is easy to inspect: a customer order arrives, VIP status is checked, payment and inventory run, notifications fire, and metrics update.",
        ],
      },
      {
        heading: "Flow",
        rows: [
          ["Order hub", "Every incoming order lands in one place with status and context."],
          ["Routing", "Rules decide which systems need to act."],
          ["Parallel execution", "Stripe, Slack, SendGrid, inventory, CRM, and analytics can run together."],
          ["Runtime logs", "Operators see what happened and when."],
          ["Builder", "Reusable workflows can be assembled from known steps."],
        ],
      },
      {
        heading: "Example run",
        code: [
          "12:34:01 order #4921 received",
          "12:34:01 customer identified: VIP tier",
          "12:34:02 payment initiated",
          "12:34:02 inventory reserved",
          "12:34:03 confirmation queued",
          "12:34:03 team alert fired",
        ],
      },
      {
        heading: "Positioning",
        bullets: [
          "Rune is about understandable automation, not hidden magic.",
          "The user should be able to inspect routing, logs, and escalation points.",
          "The terminal page lives at /rune and also accepts /cumulus/rune.",
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    route: "/contact",
    aliases: [],
    kicker: "send a note",
    summary:
      `Type a message and press Enter. The TUI opens a local email draft to ${CONTACT_EMAIL}.`,
    contact: true,
    sections: [
      {
        heading: "Direct line",
        body: [
          `Messages are addressed to ${CONTACT_EMAIL}.`,
          "This public package does not ship a secret email API key. It uses a mailto draft so the sender stays in control of the final email.",
        ],
      },
      {
        heading: "Good messages include",
        bullets: [
          "Which product you are asking about: Cumulus, Documents, Relay, Tado, or Rune.",
          "What you want built, integrated, or clarified.",
          "Any timeline or launch constraint.",
        ],
      },
    ],
  },
];

export const pageById = new Map(pages.map((page) => [page.id, page]));

export function normalizeRoute(input = "/") {
  const value = String(input || "/").trim().toLowerCase();
  if (!value || value === ".") return "/";
  return value.startsWith("/") ? value : `/${value}`;
}

export function findPage(input = "/") {
  const route = normalizeRoute(input);
  return (
    pages.find((page) => page.route === route || page.aliases.includes(route)) ??
    pages[0]
  );
}

export function pageIndex(input = "/") {
  const page = findPage(input);
  return pages.findIndex((candidate) => candidate.id === page.id);
}
