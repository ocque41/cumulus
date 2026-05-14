import Link from 'next/link';

export function TerminalSiteCallout() {
  return (
    <section
      id='terminal'
      aria-labelledby='terminal-site-title'
      className='my-14 rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-5 sm:p-7'
    >
      <div className='grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-end'>
        <div>
          <p className='font-mono text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>
            create-cumulus
          </p>
          <h2
            id='terminal-site-title'
            className='mt-4 max-w-[14ch] text-[2.5rem] font-light leading-[0.98] text-[color:var(--title)] sm:text-[3.5rem]'
          >
            Start Cumulus from a terminal.
          </h2>
          <p className='mt-5 max-w-[62ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>
            Use create-cumulus to scaffold a Relay/Cumulus app with agent auth,
            signup, actions, dashboards, docs, and Cumulus DB choices. The separate
            cumulush package still opens this website as a public TUI with Cumulus,
            Documents, Relay, Tado, Rune, and Contact pages from a horizontal link row.
          </p>
        </div>

        <div className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--color-ink)] p-4 text-[color:var(--color-paper)]'>
          <p className='font-mono text-[0.68rem] uppercase text-[color:var(--color-paper-4)]'>
            Run
          </p>
          <pre className='mt-3 overflow-x-auto font-mono text-sm leading-7 text-[color:var(--color-paper)]'>
            <code>{'npx create-cumulus@latest my-acme\nnpm create cumulus@latest my-acme\nnpx cumulush /documents'}</code>
          </pre>
          <div className='mt-5 flex flex-wrap gap-3 text-sm'>
            <Link
              href='/docs'
              className='rounded-[5.5px] border border-[color:var(--color-paper-hair)] px-3 py-2 text-[color:var(--color-paper)] transition hover:border-[color:var(--color-paper)]'
            >
              Read docs
            </Link>
            <a
              href='https://www.npmjs.com/package/create-cumulus'
              className='rounded-[5.5px] border border-[color:var(--color-paper-hair)] px-3 py-2 text-[color:var(--color-paper)] transition hover:border-[color:var(--color-paper)]'
            >
              create-cumulus
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
