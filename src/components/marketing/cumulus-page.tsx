import Link from "next/link";

import { CopyCommand } from "@/components/create/copy-command";
import {
  agentAuthRows,
  CREATE_NPM_SHORTHAND,
  CREATE_PACKAGE_NAME,
  CREATE_SHORT_COMMAND,
  createExamples,
  cumulusDbRows,
  localDbEnv,
  localDbScripts,
  templateRows,
} from "@/lib/create-command";

const flags = [
  "npm create @cmls@latest",
  "  [project-name]",
  "  --template full|outer|inner|agent-auth",
  "  --agent-auth hosted|self-hosted",
  "  --cumulus-db cloud|local|both",
  "  --with auth,db,knowledge",
  "  --install-runtimes | --no-install-runtimes",
  '  --company "Acme Inc"',
  "  --package-manager npm|pnpm|yarn|bun",
  "  --install | --no-install",
  "  --git | --no-git",
  "  --dry-run",
] as const;

function CommandBlock({ command }: { command: string }) {
  return <CopyCommand command={command} className="w-full px-4 py-3 text-sm" />;
}

function CopyTable({
  columns,
  rows,
}: {
  columns: [string, string];
  rows: Array<{ name: string; body: string }>;
}) {
  return (
    <div className="overflow-hidden rounded-[5.5px] border border-[color:var(--hairline)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="text-[color:var(--title)]">
          <tr>
            <th className="w-40 border-b border-[color:var(--hairline)] px-4 py-3 font-mono text-xs font-medium uppercase">
              {columns[0]}
            </th>
            <th className="border-b border-[color:var(--hairline)] px-4 py-3 font-mono text-xs font-medium uppercase">
              {columns[1]}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-[color:var(--hairline)] last:border-b-0">
              <td className="px-4 py-4 align-top font-mono text-xs text-[color:var(--title)]">{row.name}</td>
              <td className="px-4 py-4 leading-7 text-[color:var(--subtitle)]">{row.body}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-[0.72rem] uppercase text-[color:var(--muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-tight text-[color:var(--title)] sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-[color:var(--subtitle)]">{body}</p>
    </div>
  );
}

export function CumulusPage() {
  return (
    <main className="mx-auto w-full max-w-[1560px] px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      <section className="border-b border-[color:var(--hairline)] py-14">
        <p className="font-mono text-xs uppercase text-[color:var(--muted)]">Cumulus</p>
        <h1 className="mt-6 max-w-3xl text-5xl leading-none text-[color:var(--title)] sm:text-7xl">
          Create a Cumulus app.
        </h1>
        <p className="mt-6 max-w-2xl text-xl leading-9 text-[color:var(--subtitle)]">
          Run one command. Choose the parts. Get a ready app.
        </p>
        <div className="mt-8 max-w-3xl">
          <CommandBlock command={CREATE_SHORT_COMMAND} />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-[5.5px] border border-[color:var(--hairline)] px-5 py-3 text-sm font-semibold text-[color:var(--title)]"
          >
            Dashboard
          </Link>
        </div>
        <ul className="mt-8 grid gap-3 text-sm text-[color:var(--subtitle)] sm:grid-cols-3">
          <li>Auth, data, and Knowledge.</li>
          <li>Hosted or self-hosted Relay.</li>
          <li>Cloud, local, or both Cumulus DB.</li>
        </ul>
      </section>

      <section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <SectionHeading
            eyebrow="What it does"
            title="One command builds the app shape you choose."
            body="Cumulus asks for a few choices, then writes the app files, examples, and scripts for that shape."
          />
          <div className="mt-8">
            <CommandBlock command={CREATE_SHORT_COMMAND} />
          </div>
        </div>
        <div className="rounded-[5.5px] border border-[color:var(--hairline)] p-5 text-sm leading-7 text-[color:var(--subtitle)]">
          <p>The generated app starts from your selected template.</p>
          <p className="mt-4">The dashboard builds the exact command when you do not want to remember every flag.</p>
        </div>
      </section>

      <section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionHeading
          eyebrow="Templates"
          title="Pick how much app you want."
          body="Start small or generate the full Relay surface. Legacy aliases still work: marketing maps to outer, and inside maps to inner."
        />
        <CopyTable
          columns={["Template", "Includes"]}
          rows={templateRows.map((row) => ({ name: row.value, body: row.includes }))}
        />
      </section>

      <section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-2">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Agent Auth Modes"
            title="Choose who runs Relay auth."
            body="Hosted is the simplest path. Self-hosted gives the generated app its own Relay API and MCP surface."
          />
          <CopyTable
            columns={["Mode", "Use when"]}
            rows={agentAuthRows.map((row) => ({ name: row.value, body: row.useWhen }))}
          />
        </div>
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Cumulus DB"
            title="Choose where workspace data lives."
            body="Relay Postgres stores users, sessions, tenants, signup jobs, and API keys. Cumulus DB stores agent workspace records, key-value data, secrets, and search data."
          />
          <CopyTable
            columns={["Mode", "Meaning"]}
            rows={cumulusDbRows.map((row) => ({ name: row.value, body: row.meaning }))}
          />
        </div>
      </section>

      <section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionHeading
          eyebrow="Defaults"
          title="The defaults are made for a fast start."
          body="Full, inner, and agent-auth default to both Cumulus DB paths. Outer defaults to cloud. Missing non-interactive flags default to full, hosted, npm, no install, and no git init."
        />
        <div className="space-y-4 text-sm leading-7 text-[color:var(--subtitle)]">
          <p>
            <code className="font-mono text-[color:var(--title)]">--with auth,db,knowledge</code> is the default. It prepares user intent,
            agent signup, app start, Knowledge, and Cumulus DB progress writes.
          </p>
          <p>
            The project name is optional. When it is omitted, the command asks for it. With{" "}
            <code className="font-mono text-[color:var(--title)]">--company &quot;Acme Inc&quot;</code>, the folder and package name come from the company.
          </p>
          <p>Hosted mode writes the Relay discovery, login, signup, action, and env examples needed to connect to Relay.</p>
          <p>Full and inner include local Relay app and server parts because the dashboards need Relay database, session, and server modules.</p>
        </div>
      </section>

      <section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Flags"
            title="Use flags when you know the choices."
            body="The same choices from the dashboard can be passed directly in the terminal."
          />
          <div className="mt-8">
            <CommandBlock command={flags.join("\n")} />
          </div>
        </div>
        <div>
          <SectionHeading
            eyebrow="Local Cumulus DB"
            title="Local DB projects include scripts and env examples."
            body="Use local mode for self-hosting, demos, and private development. Use a persistent disk for the data directory in production."
          />
          <div className="mt-8 grid gap-3">
            {[...localDbScripts, ...localDbEnv].map((item) => (
              <CommandBlock key={item} command={item} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-8 py-14 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionHeading
          eyebrow="Examples"
          title="Copy the exact command you need."
          body="Use the dashboard to build your command, or start from one of these examples."
        />
        <div className="space-y-3">
          {createExamples.map((command) => (
            <CommandBlock key={command} command={command} />
          ))}
          <div className="pt-4 text-sm leading-7 text-[color:var(--subtitle)]">
            <CommandBlock command={CREATE_NPM_SHORTHAND} />
            <p className="mt-3">
              This shorthand and <code className="font-mono text-[color:var(--title)]">{CREATE_PACKAGE_NAME}</code> download the same package
              and run the same create binary after it has been published.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
