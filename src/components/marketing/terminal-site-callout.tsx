import { CopyCommand } from "@/components/create/copy-command";
import { CREATE_SHORT_COMMAND } from "@/lib/create-command";

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
            Cumulus
          </p>
          <h2
            id='terminal-site-title'
            className='mt-4 max-w-[14ch] text-[2.5rem] font-light leading-[0.98] text-[color:var(--title)] sm:text-[3.5rem]'
          >
            Create from a terminal.
          </h2>
          <p className='mt-5 max-w-[62ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>
            Run one command and choose the parts you want.
          </p>
        </div>

        <div className='rounded-[5.5px] border border-[color:var(--hairline)] p-4 text-[color:var(--color-paper)]'>
          <p className='font-mono text-[0.68rem] uppercase text-[color:var(--color-paper-4)]'>
            Run
          </p>
          <CopyCommand command={CREATE_SHORT_COMMAND} className="mt-3 w-full px-4 py-3 text-sm" />
        </div>
      </div>
    </section>
  );
}
