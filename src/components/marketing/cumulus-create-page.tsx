import Image from "next/image";
import Link from "next/link";

import { CumulusCreateMotion } from "@/components/marketing/cumulus-create-motion";
import {
  agentAuthRows,
  CREATE_PACKAGE_NAME,
  CREATE_SHORT_COMMAND,
  createExamples,
  cumulusDbRows,
  localDbEnv,
  localDbScripts,
  templateRows,
} from "@/lib/cumulus-create";

const heroReference = "/create/hero-section-reference-2.png";
const flowReference = "/create/below-the-hero-section-reference.png";
const darkLogo = "/create/darkmode.png";
const lightLogo = "/create/lightmode.png";

const flags = [
  "create <project-name>",
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
  return (
    <code
      data-create-command
      data-create-reveal
      className="block overflow-x-auto rounded-[5.5px] border border-[color:var(--hairline)] bg-black px-4 py-3 font-mono text-sm leading-7 text-[color:var(--color-paper)]"
    >
      {command}
    </code>
  );
}

function CopyTable({
  columns,
  rows,
}: {
  columns: [string, string];
  rows: Array<{ name: string; body: string }>;
}) {
  return (
    <div data-create-reveal className="overflow-hidden rounded-[5.5px] border border-[color:var(--hairline)]">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[color:var(--color-paper-wash)] text-[color:var(--title)]">
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
    <div data-create-reveal className="max-w-3xl">
      <p className="font-mono text-[0.72rem] uppercase text-[color:var(--muted)]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl leading-tight text-[color:var(--title)] sm:text-5xl">{title}</h2>
      <p className="mt-4 text-base leading-8 text-[color:var(--subtitle)]">{body}</p>
    </div>
  );
}

export function CumulusCreatePage() {
  return (
    <CumulusCreateMotion>
    <main className="mx-auto w-full max-w-[1560px] px-4 pb-24 pt-6 sm:px-6 lg:px-10">
      <section
        data-create-section
        className="relative min-h-[calc(100svh-9rem)] overflow-hidden rounded-[5.5px] border border-[color:var(--hairline)] bg-black"
      >
        <Image
          src={heroReference}
          alt=""
          priority
          fill
          sizes="100vw"
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.86),rgba(0,0,0,0.42),rgba(0,0,0,0.12))]" />
        <div className="relative z-10 flex min-h-[calc(100svh-9rem)] max-w-4xl flex-col justify-between p-5 sm:p-8 lg:p-12">
          <div data-create-logo className="flex w-fit items-center gap-3">
            <Image src={darkLogo} alt="Cumulus" width={1122} height={1402} className="h-16 w-16 rounded-[5.5px] object-cover" />
            <span className="font-mono text-xs uppercase text-[color:var(--color-paper)]">
              Cumulus Create
            </span>
          </div>

          <div className="py-16">
            <h1 data-create-title className="max-w-[10ch] text-[clamp(4rem,11vw,10rem)] leading-[0.82] text-[color:var(--color-paper)]">
              Create.
            </h1>
            <p data-create-reveal className="mt-8 max-w-2xl text-xl leading-9 text-[color:rgba(245,245,245,0.86)] sm:text-2xl">
              Run one command. Choose the parts. Get a ready Cumulus app.
            </p>
            <div className="mt-8 max-w-3xl">
              <CommandBlock command={CREATE_SHORT_COMMAND} />
            </div>
            <div data-create-reveal className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-[5.5px] bg-[color:var(--color-paper)] px-5 py-3 text-sm font-semibold text-[color:var(--color-ink)] transition hover:opacity-90"
              >
                Build command
              </Link>
            </div>
          </div>

          <div data-create-reveal className="grid gap-3 text-sm text-[color:rgba(245,245,245,0.78)] sm:grid-cols-3">
            <span>Auth, data, and Knowledge.</span>
            <span>Hosted or self-hosted Relay.</span>
            <span>Cloud, local, or both Cumulus DB.</span>
          </div>
        </div>
      </section>

      <section data-create-section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeading
            eyebrow="What it does"
            title="One command builds the app shape you choose."
            body="Cumulus Create asks for a few choices, then writes the app files, examples, and scripts for that shape."
          />
          <div className="mt-8">
            <CommandBlock command={CREATE_SHORT_COMMAND} />
          </div>
        </div>
        <div data-create-float className="overflow-hidden rounded-[5.5px] border border-[color:var(--hairline)] bg-black">
          <Image
            src={flowReference}
            alt=""
            width={1672}
            height={941}
            className="h-full w-full object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
      </section>

      <section data-create-section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-[0.72fr_1.28fr]">
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

      <section data-create-section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-2">
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

      <section data-create-section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-[0.72fr_1.28fr]">
        <SectionHeading
          eyebrow="Defaults"
          title="The defaults are made for a fast start."
          body="Full, inner, and agent-auth default to both Cumulus DB paths. Outer defaults to cloud. Missing non-interactive flags default to full, hosted, npm, no install, and no git init."
        />
        <div data-create-reveal className="space-y-4 text-sm leading-7 text-[color:var(--subtitle)]">
          <p>
            <code className="font-mono text-[color:var(--title)]">--with auth,db,knowledge</code> is the default. It prepares user intent,
            agent signup, app start, Knowledge, and Cumulus DB progress writes.
          </p>
          <p>
            <code className="font-mono text-[color:var(--title)]">my-acme</code> and{" "}
            <code className="font-mono text-[color:var(--title)]">my-cumulus-app</code> are placeholder names. With{" "}
            <code className="font-mono text-[color:var(--title)]">--company &quot;Acme Inc&quot;</code>, the folder and package name come from the company.
          </p>
          <p>
            Hosted mode writes the Relay discovery, login, signup, action, and env examples needed to connect to Relay.
          </p>
          <p>
            Full and inner include local Relay app and server parts because the dashboards need Relay database, session, and server modules.
          </p>
        </div>
      </section>

      <section data-create-section className="grid gap-8 border-b border-[color:var(--hairline)] py-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            eyebrow="Flags"
            title="Use flags when you know the choices."
            body="The same choices from the dashboard can be passed directly in the terminal."
          />
          <div data-create-reveal className="mt-8 rounded-[5.5px] border border-[color:var(--hairline)] bg-black p-4">
            <pre className="overflow-x-auto font-mono text-sm leading-7 text-[color:var(--color-paper)]">{flags.join("\n")}</pre>
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

      <section data-create-section className="grid gap-8 py-14 lg:grid-cols-[0.72fr_1.28fr]">
        <div>
          <SectionHeading
            eyebrow="Examples"
            title="Copy the exact command you need."
            body="Use the dashboard to build your command, or start from one of these examples."
          />
          <div data-create-float className="mt-8 hidden rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--color-paper)] p-4 sm:block">
            <Image src={lightLogo} alt="Cumulus" width={1122} height={1402} className="mx-auto h-40 w-40 object-cover" />
          </div>
        </div>
        <div className="space-y-3">
          {createExamples.map((command) => (
            <CommandBlock key={command} command={command} />
          ))}
          <p className="pt-4 text-sm leading-7 text-[color:var(--subtitle)]">
            <code className="font-mono text-[color:var(--title)]">npm create @cmls@latest</code> is shorthand for{" "}
            <code className="font-mono text-[color:var(--title)]">{CREATE_PACKAGE_NAME}</code>. Both commands download the same package
            and run the same create binary after it has been published.
          </p>
        </div>
      </section>
    </main>
    </CumulusCreateMotion>
  );
}
