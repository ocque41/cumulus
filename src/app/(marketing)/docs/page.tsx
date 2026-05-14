import type { Metadata } from 'next';
import Link from 'next/link';

import { PageBackground } from '@/components/site/page-background';

export const metadata: Metadata = {
  title: 'create-cumulus Docs',
  description:
    'Install and use create-cumulus to scaffold Relay/Cumulus apps with templates, agent auth, actions, dashboards, and Cumulus DB modes.',
};

const repositoryUrl = (process.env.NEXT_PUBLIC_REPOSITORY_URL || 'https://github.com/cumulus/cumulus').replace(/\/$/, '');

const installCommands = [
  {
    label: 'Direct command',
    body: 'Runs the published package with npx.',
    code: 'npx create-cumulus@latest my-acme',
  },
  {
    label: 'npm create shorthand',
    body: 'npm maps this to create-cumulus@latest and runs the same binary.',
    code: 'npm create cumulus@latest my-acme',
  },
  {
    label: 'Non-interactive starter',
    body: 'Use flags when an agent, script, or CI job should not prompt.',
    code: 'npx create-cumulus@latest my-acme --template full --agent-auth hosted',
  },
];

const templates = [
  {
    name: 'full',
    body: 'Relay public site, /me, /dev, dashboards, API/MCP, docs, auth, signup, and actions.',
  },
  {
    name: 'outer',
    body: 'Public marketing and docs site with discovery, signup, and action bootstrap.',
  },
  {
    name: 'inner',
    body: '/me and /dev dashboards, settings, API/MCP, auth, and actions.',
  },
  {
    name: 'agent-auth',
    body: 'Smallest Relay-branded starter with attestation login, signup, and actions.',
  },
];

const authModes = [
  {
    name: 'hosted',
    body: 'Use hosted Relay auth, signup, and action dispatch. The generated bootstrap endpoints point to hosted Cumulus Cloud by default.',
  },
  {
    name: 'self-hosted',
    body: 'Generate a local Relay-style API/MCP surface that the app owns.',
  },
];

const dbModes = [
  {
    name: 'cloud',
    body: 'Use hosted Cumulus DB through hosted Relay/Cumulus Cloud.',
  },
  {
    name: 'local',
    body: 'Include the AGPL Cumulus DB service and run it locally.',
  },
  {
    name: 'both',
    body: 'Include local service files and keep the hosted path documented.',
  },
];

const dbDefaults = [
  'full, inner, and agent-auth default to both.',
  'outer defaults to cloud.',
  'Use --cumulus-db cloud with agent-auth when you want the small hosted MIT starter.',
];

const generatedSurfaces = [
  '/.well-known/relay.json',
  '/api/relay-login',
  '/api/agent-signup',
  '/api/actions',
  '/v1/* in self-hosted mode',
  '/mcp in self-hosted mode',
  '/.well-known/jwks.json in self-hosted mode',
  '/openapi.json in self-hosted mode',
];

const flags = [
  '--template full|outer|inner|agent-auth',
  '--agent-auth hosted|self-hosted',
  '--cumulus-db cloud|local|both',
  '--company "Acme Inc"',
  '--package-manager npm|pnpm|yarn|bun',
  '--install | --no-install',
  '--git | --no-git',
];

const localDbScripts = [
  'npm run cumulus-db:build',
  'npm run cumulus-db:start',
  'npm run cumulus-db:test',
  'npm run cumulus-db:smoke',
  'npm run cumulus-db:workspace',
];

const envNames = [
  'CUMULUS_DB_PUBLIC_URL=http://localhost:4317',
  'CUMULUS_DB_INTERNAL_URL=http://localhost:4317',
  'CUMULUS_DB_MASTER_KEY=replace-with-32-byte-base64-key',
  'CUMULUS_DB_RELAY_WEBHOOK_SECRET=replace-with-relay-tenant-webhook-secret',
  'CUMULUS_DB_DATA_DIR=.cumulus-db-data',
  'CUMULUS_DB_PORT=4317',
];

const relatedDocs = [
  {
    href: `${repositoryUrl}/blob/main/docs/self-hosting.md`,
    label: 'Self-hosting',
  },
  {
    href: `${repositoryUrl}/blob/main/docs/licensing.md`,
    label: 'Licensing',
  },
  {
    href: `${repositoryUrl}/blob/main/docs/private-overlay.md`,
    label: 'Private overlay',
  },
  {
    href: `${repositoryUrl}/blob/main/docs/terminal-site.md`,
    label: 'Terminal site',
  },
];

function CodeLine({ children }: { children: string }) {
  return (
    <code className='block overflow-x-auto rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--color-ink)] px-4 py-3 font-mono text-xs leading-6 text-[color:var(--color-paper)] sm:text-sm'>
      {children}
    </code>
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
    <div className='max-w-[760px]'>
      <p className='font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>{eyebrow}</p>
      <h2 className='mt-3 text-[2rem] font-light leading-tight text-[color:var(--title)] sm:text-[2.6rem]'>
        {title}
      </h2>
      <p className='mt-4 text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>{body}</p>
    </div>
  );
}

export default function DocsPage() {
  return (
    <>
      <PageBackground color='#1a1a1a' />
      <main className='mx-auto w-full max-w-[1180px] px-4 pb-24 pt-10 sm:px-6 lg:px-8'>
        <header className='border-b border-[color:var(--hairline)] pb-10'>
          <p className='font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>
            Docs
          </p>
          <h1 className='mt-4 max-w-[820px] text-[3rem] font-light leading-none text-[color:var(--title)] sm:text-[4.5rem]'>
            Start a Cumulus app with create-cumulus.
          </h1>
          <p className='mt-5 max-w-[760px] text-base leading-8 text-[color:var(--subtitle)] sm:text-lg'>
            `create-cumulus` scaffolds Relay/Cumulus apps with agent auth, signup, actions,
            dashboards, branded UI, docs, and Cumulus DB choices. Use this page to pick the
            smallest template that matches how much of the stack you want to own.
          </p>
          <div className='mt-7 flex flex-wrap gap-3 text-sm'>
            <a
              href='https://www.npmjs.com/package/create-cumulus'
              className='rounded-[5.5px] bg-[color:var(--color-paper)] px-4 py-3 text-[color:var(--color-ink)] transition hover:opacity-90'
            >
              npm package
            </a>
            <Link
              href='/'
              className='rounded-[5.5px] border border-[color:var(--hairline)] px-4 py-3 text-[color:var(--text)] transition hover:border-[color:var(--text)]'
            >
              Back home
            </Link>
          </div>
        </header>

        <section className='grid gap-4 py-10 lg:grid-cols-3'>
          {installCommands.map((command) => (
            <article key={command.label} className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-5'>
              <h2 className='text-lg font-semibold text-[color:var(--title)]'>{command.label}</h2>
              <p className='mt-2 min-h-12 text-sm leading-6 text-[color:var(--subtitle)]'>{command.body}</p>
              <div className='mt-5'>
                <CodeLine>{command.code}</CodeLine>
              </div>
            </article>
          ))}
        </section>

        <section className='py-10'>
          <SectionHeading
            eyebrow='Templates'
            title='Pick how much app you want generated.'
            body='The package can create a full Relay/Cumulus app or a smaller starter. Legacy aliases still work: marketing maps to outer, and inside maps to inner.'
          />
          <div className='mt-7 grid gap-4 md:grid-cols-2'>
            {templates.map((template) => (
              <article key={template.name} className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-5'>
                <h3 className='font-mono text-sm text-[color:var(--title)]'>{template.name}</h3>
                <p className='mt-3 text-sm leading-7 text-[color:var(--subtitle)]'>{template.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className='grid gap-8 border-t border-[color:var(--hairline)] py-10 lg:grid-cols-2'>
          <div>
            <SectionHeading
              eyebrow='Agent auth'
              title='Use hosted Relay or own the local control plane.'
              body='Hosted mode keeps setup simple. Self-hosted mode emits the local API/MCP surface for teams that need to own the agent-facing service.'
            />
            <div className='mt-7 grid gap-4'>
              {authModes.map((mode) => (
                <article key={mode.name} className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-5'>
                  <h3 className='font-mono text-sm text-[color:var(--title)]'>{mode.name}</h3>
                  <p className='mt-3 text-sm leading-7 text-[color:var(--subtitle)]'>{mode.body}</p>
                </article>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow='Cumulus DB'
              title='Choose cloud, local, or both.'
              body='Cumulus DB stores agent workspace records, key-value data, secrets, and search data through a separate HTTP service. Defaults matter for licensing.'
            />
            <div className='mt-7 grid gap-4'>
              {dbModes.map((mode) => (
                <article key={mode.name} className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-5'>
                  <h3 className='font-mono text-sm text-[color:var(--title)]'>{mode.name}</h3>
                  <p className='mt-3 text-sm leading-7 text-[color:var(--subtitle)]'>{mode.body}</p>
                </article>
              ))}
            </div>
            <ul className='mt-5 space-y-2 text-sm leading-7 text-[color:var(--subtitle)]'>
              {dbDefaults.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className='grid gap-8 border-t border-[color:var(--hairline)] py-10 lg:grid-cols-[0.85fr_1.15fr]'>
          <SectionHeading
            eyebrow='Generated app'
            title='What appears in the project.'
            body='Hosted mode emits public bootstrap endpoints and environment examples. Self-hosted mode adds the local Relay control plane, API docs, workflows, schema, and migrations.'
          />
          <div className='grid gap-3 sm:grid-cols-2'>
            {generatedSurfaces.map((surface) => (
              <div key={surface} className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-4'>
                <code className='font-mono text-xs leading-6 text-[color:var(--text)]'>{surface}</code>
              </div>
            ))}
          </div>
        </section>

        <section className='grid gap-8 border-t border-[color:var(--hairline)] py-10 lg:grid-cols-2'>
          <div>
            <SectionHeading
              eyebrow='Flags'
              title='Run it without prompts.'
              body='If flags are missing in an interactive terminal, the CLI asks for them. In non-interactive mode it defaults to full, hosted, npm, no install, and no git init.'
            />
            <div className='mt-7 space-y-3'>
              <CodeLine>{'create-cumulus <project-name>'}</CodeLine>
              {flags.map((flag) => (
                <CodeLine key={flag}>{flag}</CodeLine>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading
              eyebrow='Local DB'
              title='Scripts and settings for local Cumulus DB.'
              body='Use local mode for self-hosting, demos, and private development. In production, put CUMULUS_DB_DATA_DIR on persistent storage.'
            />
            <div className='mt-7 space-y-3'>
              {localDbScripts.map((script) => (
                <CodeLine key={script}>{script}</CodeLine>
              ))}
            </div>
          </div>
        </section>

        <section className='grid gap-8 border-t border-[color:var(--hairline)] py-10 lg:grid-cols-[0.85fr_1.15fr]'>
          <SectionHeading
            eyebrow='Environment'
            title='Public examples use placeholders.'
            body='These names appear when local Cumulus DB is present. Replace placeholder secrets outside public commits and keep real production values in the private overlay.'
          />
          <div className='space-y-3'>
            {envNames.map((name) => (
              <CodeLine key={name}>{name}</CodeLine>
            ))}
          </div>
        </section>

        <section className='grid gap-8 border-t border-[color:var(--hairline)] py-10 lg:grid-cols-2'>
          <div>
            <SectionHeading
              eyebrow='Licenses'
              title='Know the boundary before publishing.'
              body='The generator itself is MIT. Generated projects change license shape depending on the template and whether local Cumulus DB is included.'
            />
            <ul className='mt-7 space-y-3 text-sm leading-7 text-[color:var(--subtitle)]'>
              <li>Generated full, inner, and self-hosted Relay templates are AGPL-3.0-only.</li>
              <li>outer defaults to cloud Cumulus DB and can stay MIT in hosted mode.</li>
              <li>agent-auth defaults to both Cumulus DB modes, so it includes local Cumulus DB and is AGPL unless you explicitly use --cumulus-db cloud.</li>
              <li>Generated app code talks to Cumulus DB over HTTP/token APIs. It does not import Cumulus DB source directly.</li>
            </ul>
          </div>

          <div>
            <SectionHeading
              eyebrow='Related'
              title='Read the public repo docs next.'
              body='Use these files when you need the broader Cumulus public/private split, self-hosting path, and release safety checklist.'
            />
            <div className='mt-7 flex flex-wrap gap-3'>
              {relatedDocs.map((doc) => (
                <a
                  key={doc.href}
                  href={doc.href}
                  className='rounded-[5.5px] border border-[color:var(--hairline)] px-4 py-3 text-sm text-[color:var(--text)] transition hover:border-[color:var(--text)]'
                >
                  {doc.label}
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
