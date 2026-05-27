export const CONTACT_EMAIL = "hi@cumulush.com";

export const pages = [
  {
    id: "home",
    title: "Cumulus",
    route: "/",
    aliases: ["/home"],
    kicker: "agent database",
    summary:
      "Cumulus DB is the free database for AI agents. Start local, connect with scoped access, and keep agent memory inspectable.",
    sections: [
      {
        heading: "What Cumulus does",
        body: [
          "Cumulus DB gives agents durable workspace memory for records, key-value state, events, search, and scoped system workflows.",
          "The fastest local path is to build and start the database service from the repo.",
          "The app connects to Cumulus DB through HTTP/token APIs. Agent-facing routes use scoped access instead of a master key.",
          "Private provider values, customer data, deployment credentials, and internal runbooks stay outside the public repo.",
        ],
      },
      {
        heading: "Start locally",
        code: [
          "npm run db:build",
          "npm run db:start",
          "npm run db:cli -- help",
        ],
      },
      {
        heading: "Operating rules",
        bullets: [
          "Keep agent access scoped.",
          "Keep master keys out of public user routes.",
          "Keep provider secrets out of the repo.",
          "Keep setup steps direct.",
        ],
      },
      {
        heading: "What is here",
        rows: [
          ["Cumulus DB", "Agent workspace records, key-value state, events, search, and scoped system workflows."],
          ["Dashboard", "A browser surface for connecting a database id and scoped bearer token."],
          ["System", "Agent bootstrap, schema plans, approvals, snapshots, audit, apply, and revert."],
          ["Docs", "Setup, licensing, self-hosting, and release safety."],
          ["Contact", `A terminal contact prompt that creates a draft to ${CONTACT_EMAIL}.`],
        ],
      },
      {
        heading: "Run it",
        code: [
          "npx cumulush",
          "npx cumulush /documents",
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
    kicker: "Cumulus DB guide",
    summary:
      "One page for running Cumulus DB locally, choosing an engine, connecting the dashboard, and keeping the public boundary clear.",
    sections: [
      {
        heading: "Start the service",
        body: [
          "Build and run the Cumulus DB provider from this repo.",
          "Use the dashboard with a database id and scoped bearer token. Keep the master key out of public user routes.",
        ],
        code: [
          "npm run db:build",
          "npm run db:start",
          "npm run db:cli -- help",
        ],
      },
      {
        heading: "Database surfaces",
        rows: [
          ["records", "Typed workspace memory for notes, runs, messages, tool calls, artifacts, tasks, observations, secrets, and evidence."],
          ["key-value", "Small state entries for run ids, progress markers, evidence pointers, and handoff notes."],
          ["events", "Append-only history so humans can inspect what an agent did and when it did it."],
          ["system", "Agent bootstrap, schema plans, approvals, snapshots, audit, apply, and revert behind hard scopes."],
        ],
      },
      {
        heading: "Runtime paths",
        rows: [
          ["jsonl", "Use deterministic local files under CUMULUS_DB_DATA_DIR for local development and demos."],
          ["postgres", "Use CUMULUS_DB_POSTGRES_URL with the hosted-style PostgreSQL schema contracts."],
          ["dashboard", "Connect /dashboard/database or /dashboard/system with a database id and scoped bearer token."],
        ],
      },
      {
        heading: "Environment values",
        code: [
          "CUMULUS_DB_PUBLIC_URL=http://localhost:4317",
          "CUMULUS_DB_INTERNAL_URL=http://localhost:4317",
          "CUMULUS_DB_ENGINE=jsonl",
          "CUMULUS_DB_MASTER_KEY=replace-with-32-byte-base64-key",
          "CUMULUS_DB_DATA_DIR=.cumulus-db-data",
          "CUMULUS_DB_PORT=4317",
          "CUMULUS_DB_AUTO_MIGRATE=false",
        ],
      },
      {
        heading: "License boundary",
        bullets: [
          "The root app, docs, auth package, public migrations, tests, and app integration code are Apache-2.0.",
          "The Cumulus DB provider package is AGPL-3.0-only.",
          "App-side code talks to Cumulus DB over HTTP/token APIs. It does not import Cumulus DB source directly.",
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
    id: "contact",
    title: "Contact",
    route: "/contact",
    aliases: [],
    kicker: "send a note",
    summary:
      `Type a message and press Enter. The TUI creates a local email draft to ${CONTACT_EMAIL}.`,
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
          "Whether you are asking about local Cumulus DB, managed setup, docs, or dashboard wiring.",
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
