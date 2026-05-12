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
          <p className='font-mono text-[0.72rem] uppercase text-[color:var(--muted)]'>
            Terminal site
          </p>
          <h2
            id='terminal-site-title'
            className='mt-4 max-w-[14ch] text-[2.5rem] font-light leading-[0.98] text-[color:var(--title)] sm:text-[3.5rem]'
          >
            Open Cumulus from a terminal.
          </h2>
          <p className='mt-5 max-w-[62ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>
            The Cumulus website now ships as a public TUI. Run the command, browse the
            Cumulus, Documents, Relay, Tado, Rune, and Contact pages, then send a local
            email draft to hi@cumulush.com from the contact screen.
          </p>
        </div>

        <div className='rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--color-ink)] p-4 text-[color:var(--color-paper)]'>
          <p className='font-mono text-[0.68rem] uppercase text-[color:var(--color-paper-4)]'>
            Run
          </p>
          <pre className='mt-3 overflow-x-auto font-mono text-sm leading-7 text-[color:var(--color-paper)]'>
            <code>{'npx cumulush\nnpx cumulush /relay\nnpx cumulush /contact'}</code>
          </pre>
          <div className='mt-5 flex flex-wrap gap-3 text-sm'>
            <Link
              href='/docs'
              className='rounded-[5.5px] border border-[color:var(--color-paper-hair)] px-3 py-2 text-[color:var(--color-paper)] transition hover:border-[color:var(--color-paper)]'
            >
              Read docs
            </Link>
            <a
              href='https://www.npmjs.com/package/cumulush'
              className='rounded-[5.5px] border border-[color:var(--color-paper-hair)] px-3 py-2 text-[color:var(--color-paper)] transition hover:border-[color:var(--color-paper)]'
            >
              npm package
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
