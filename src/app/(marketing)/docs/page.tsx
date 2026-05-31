import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cumulus DB Docs',
  description:
    'Run the free Cumulus DB service, connect the dashboard, and keep agent access scoped.',
};

const repositoryUrl = (process.env.NEXT_PUBLIC_REPOSITORY_URL || 'https://github.com/cumulus/cumulus').replace(/\/$/, '');

const installCommands = [
  {
    label: 'Build service',
    body: 'Compile the Cumulus DB provider from this repo.',
    code: 'npm run db:build',
  },
  {
    label: 'Start service',
    body: 'Run the free local agent database on the configured port.',
    code: 'npm run db:start',
  },
];

const templates = [
  {
    name: 'records',
    body: 'Typed workspace memory for notes, runs, messages, tool calls, artifacts, tasks, observations, secrets, and evidence.',
  },
  {
    name: 'key-value',
    body: 'Small state entries for run ids, progress markers, evidence pointers, and handoff notes.',
  },
  {
    name: 'events',
    body: 'Append-only history so humans can inspect what an agent did and when it did it.',
  },
  {
    name: 'system',
    body: 'Agent bootstrap, schema plans, approvals, snapshots, audit, apply, and revert behind hard scopes.',
  },
];

const authModes = [
  {
    name: 'scoped bearer token',
    body: 'Public user routes require a signed-in app user and a Cumulus DB bearer token.',
  },
  {
    name: 'no master key in public routes',
    body: 'The dashboard can use scoped tokens without exposing the Cumulus DB master key.',
  },
];

const dbModes = [
  {
    name: 'jsonl',
    body: 'Use deterministic local files under CUMULUS_DB_DATA_DIR for local development and demos.',
  },
  {
    name: 'postgres',
    body: 'Use CUMULUS_DB_POSTGRES_URL with the hosted-style PostgreSQL schema contracts.',
  },
  {
    name: 'dashboard',
    body: 'Connect /dashboard/database or /dashboard/system with a database id and scoped bearer token.',
  },
];

const dbDefaults = [
  'jsonl is the simplest local engine.',
  'postgres requires CUMULUS_DB_POSTGRES_URL.',
  'CUMULUS_DB_AUTO_MIGRATE=false is the safe production default.',
];

const generatedSurfaces = [
  '/dashboard/database',
  '/dashboard/system',
  '/api/cumulus-db/*',
  '/api/cumulus-db/system/*',
  '/v1/databases/:id/records',
  '/v1/databases/:id/search',
  '/v1/databases/:id/events',
  '/v1/system/*',
];

const flags = [
  'CUMULUS_DB_ENGINE=jsonl',
  'CUMULUS_DB_ENGINE=postgres',
  'CUMULUS_DB_POSTGRES_URL=postgres://user:pass@host:5432/db',
  'CUMULUS_DB_AUTO_MIGRATE=false',
  'CUMULUS_DB_PUBLIC_AGENT_BOOTSTRAP_ENABLED=false',
];

const localDbScripts = [
  'npm run db:build',
  'npm run db:start',
  'npm run db:test',
  'npm run db:smoke',
  'npm run db:cli -- help',
];

const envNames = [
  'CUMULUS_DB_PUBLIC_URL=http://localhost:4317',
  'CUMULUS_DB_INTERNAL_URL=http://localhost:4317',
  'CUMULUS_DB_ENGINE=jsonl',
  'CUMULUS_DB_MASTER_KEY=replace-with-32-byte-base64-key',
  'CUMULUS_DB_DATA_DIR=.cumulus-db-data',
  'CUMULUS_DB_PORT=4317',
  'CUMULUS_DB_POSTGRES_URL=',
  'CUMULUS_DB_AUTO_MIGRATE=false',
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
    <main className='mx-auto w-full max-w-[1180px] px-4 pb-24 pt-10 sm:px-6 lg:px-8'>
      <header className='border-b border-[color:var(--hairline)] pb-10'>
        <p className='font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>
          Docs
        </p>
        <h1 className='mt-4 max-w-[820px] text-[3rem] font-light leading-none text-[color:var(--title)] sm:text-[4.5rem]'>
          Start Cumulus DB for your agent.
        </h1>
        <p className='mt-5 max-w-[760px] text-base leading-8 text-[color:var(--subtitle)] sm:text-lg'>
          Cumulus DB is the free database path in this repo. Use it for agent records,
          key-value state, events, search, and scoped system workflows without exposing
          a master key through public user routes.
        </p>
        <div className='mt-7 flex flex-wrap gap-3 text-sm'>
          <a
            href={`${repositoryUrl}/tree/main/apps/cumulus-db`}
            className='rounded-[5.5px] bg-[color:var(--color-paper)] px-4 py-3 text-[color:var(--color-ink)] transition hover:opacity-90'
          >
            Cumulus DB source
          </a>
          <Link
            href='/'
            className='rounded-[5.5px] border border-[color:var(--hairline)] px-4 py-3 text-[color:var(--text)] transition hover:border-[color:var(--text)]'
          >
            Back home
          </Link>
        </div>
      </header>

      <section className='grid gap-4 py-10 lg:grid-cols-2'>
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
          title='Pick the database surface your agent needs.'
          body='Each Cumulus DB surface has one job. Start with records and key-value state, then add events and system workflows when the agent needs more control.'
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
            eyebrow='Agent access'
            title='Use scoped access, not a master key.'
            body='Agents should get the narrow capability they need. Keep the Cumulus DB master key out of public user routes and use bearer tokens with matching scopes.'
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
            title='Choose the runtime path.'
            body='Cumulus DB stores agent workspace records, key-value data, events, secrets, and search data through a separate HTTP service. Start local, then move to PostgreSQL when production needs it.'
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
          title='What the app connects to.'
          body='The public app talks to Cumulus DB through HTTP/token APIs. It does not import the AGPL provider source into Apache-side app code.'
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
            title='Set runtime choices explicitly.'
            body='Use environment variables to choose the local JSONL engine, PostgreSQL engine, migration behavior, and whether public agent bootstrap is allowed.'
          />
          <div className='mt-7 space-y-3'>
            <CodeLine>{'npm run db:start'}</CodeLine>
            {flags.map((flag) => (
              <CodeLine key={flag}>{flag}</CodeLine>
            ))}
          </div>
        </div>

        <div>
          <SectionHeading
            eyebrow='Local DB'
            title='Scripts and settings for local Cumulus DB.'
            body='Use the local service for self-hosting, demos, and private development. In production, put CUMULUS_DB_DATA_DIR on persistent storage or use PostgreSQL.'
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
            body='The root app and marketing code are Apache-2.0. The Cumulus DB provider in apps/cumulus-db is AGPL-3.0-only.'
          />
          <ul className='mt-7 space-y-3 text-sm leading-7 text-[color:var(--subtitle)]'>
            <li>Keep database engine changes inside apps/cumulus-db.</li>
            <li>Do not import @cumulus/database or provider source from Apache-side app code.</li>
            <li>Talk to Cumulus DB over HTTP/token APIs.</li>
            <li>Use placeholders for public examples and keep real production values in the private overlay.</li>
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
  );
}
