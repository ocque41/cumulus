export const CREATE_SHORT_COMMAND = "npm create @cmls@latest my-acme";
export const CREATE_NPM_SHORTHAND = "npm create @cmls@latest";
export const CREATE_PACKAGE_NAME = "@cmls/create@latest";

export const CREATE_FEATURES = ["auth", "db", "knowledge"] as const;
export const CREATE_TEMPLATES = ["full", "outer", "inner", "agent-auth"] as const;
export const CREATE_AGENT_AUTH_MODES = ["hosted", "self-hosted"] as const;
export const CREATE_CUMULUS_DB_MODES = ["cloud", "local", "both"] as const;
export const CREATE_PACKAGE_MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;

export type CreateFeature = (typeof CREATE_FEATURES)[number];
export type CreateTemplate = (typeof CREATE_TEMPLATES)[number];
export type CreateAgentAuthMode = (typeof CREATE_AGENT_AUTH_MODES)[number];
export type CreateCumulusDbMode = (typeof CREATE_CUMULUS_DB_MODES)[number];
export type CreatePackageManager = (typeof CREATE_PACKAGE_MANAGERS)[number];

export type CreateCommandOptions = {
  projectName: string;
  company: string;
  template: CreateTemplate;
  agentAuth: CreateAgentAuthMode;
  cumulusDb: CreateCumulusDbMode;
  features: CreateFeature[];
  packageManager: CreatePackageManager;
  install: boolean;
  git: boolean;
  dryRun: boolean;
  installRuntimes: boolean;
};

export const createDefaults: CreateCommandOptions = {
  projectName: "my-acme",
  company: "",
  template: "full",
  agentAuth: "hosted",
  cumulusDb: "both",
  features: ["auth", "db", "knowledge"],
  packageManager: "npm",
  install: false,
  git: false,
  dryRun: false,
  installRuntimes: false,
};

export const templateRows = [
  {
    value: "full",
    includes: "Public site, /me, /dev, dashboards, API/MCP, docs, auth, signup, and actions.",
  },
  {
    value: "outer",
    includes: "Public site, docs, discovery, signup, and action start.",
  },
  {
    value: "inner",
    includes: "/me, /dev, settings, API/MCP, auth, and actions.",
  },
  {
    value: "agent-auth",
    includes: "Smallest starter for discovery, attestation login, signup, and actions.",
  },
] satisfies Array<{ value: CreateTemplate; includes: string }>;

export const agentAuthRows = [
  {
    value: "hosted",
    useWhen: "Relay runs auth, signup, and actions.",
  },
  {
    value: "self-hosted",
    useWhen: "The generated app runs its own Relay API and MCP surface.",
  },
] satisfies Array<{ value: CreateAgentAuthMode; useWhen: string }>;

export const cumulusDbRows = [
  {
    value: "cloud",
    meaning: "Use hosted Cumulus DB through Relay and Cumulus Cloud.",
  },
  {
    value: "local",
    meaning: "Add the local Cumulus DB service.",
  },
  {
    value: "both",
    meaning: "Add the local service and keep the hosted path in examples.",
  },
] satisfies Array<{ value: CreateCumulusDbMode; meaning: string }>;

export const localDbScripts = [
  "npm run cumulus-db:build",
  "npm run cumulus-db:start",
  "npm run cumulus-db:test",
  "npm run cumulus-db:smoke",
  "npm run cumulus-db:workspace",
] as const;

export const localDbEnv = [
  "CUMULUS_DB_PUBLIC_URL=http://localhost:4317",
  "CUMULUS_DB_INTERNAL_URL=http://localhost:4317",
  "CUMULUS_DB_MASTER_KEY=replace-with-32-byte-base64-key",
  "CUMULUS_DB_RELAY_WEBHOOK_SECRET=replace-with-relay-tenant-webhook-secret",
  "CUMULUS_DB_DATA_DIR=.cumulus-db-data",
  "CUMULUS_DB_PORT=4317",
] as const;

export const createExamples = [
  CREATE_SHORT_COMMAND,
  'npm create @cmls@latest my-acme -- --template full --agent-auth hosted --company "Acme Inc"',
  "npm create @cmls@latest my-acme -- --template outer --agent-auth hosted",
  "npm create @cmls@latest my-acme -- --template inner --agent-auth hosted",
  "npm create @cmls@latest my-acme -- --template full --agent-auth self-hosted --with auth,db,knowledge --install-runtimes",
  "npm create @cmls@latest my-acme -- --template agent-auth --cumulus-db cloud",
] as const;

export function defaultCumulusDbForTemplate(template: CreateTemplate): CreateCumulusDbMode {
  return template === "outer" ? "cloud" : "both";
}

export function normalizeProjectName(value: string) {
  return value.trim() || createDefaults.projectName;
}

export function quoteShellValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^[A-Za-z0-9._/@:-]+$/.test(trimmed)) return trimmed;
  return `"${trimmed.replace(/(["\\$`])/g, "\\$1")}"`;
}

export function buildCreateCommand(options: CreateCommandOptions) {
  const projectName = quoteShellValue(normalizeProjectName(options.projectName));
  const flags = [
    "--template",
    options.template,
    "--agent-auth",
    options.agentAuth,
    "--cumulus-db",
    options.cumulusDb,
  ];

  if (options.features.length > 0) {
    flags.push("--with", options.features.join(","));
  }

  if (options.installRuntimes && options.features.includes("knowledge")) {
    flags.push("--install-runtimes");
  }

  flags.push("--package-manager", options.packageManager);

  if (options.company.trim()) {
    flags.push("--company", quoteShellValue(options.company));
  }

  flags.push(options.install ? "--install" : "--no-install");
  flags.push(options.git ? "--git" : "--no-git");

  if (options.dryRun) {
    flags.push("--dry-run");
  }

  return `npm create @cmls@latest ${projectName} -- ${flags.join(" ")}`;
}
