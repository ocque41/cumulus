import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/site/page-background';

export const metadata: Metadata = {
  title: 'Cumulus Cloud',
  description: 'Use Cumulus hosted APIs instead of running every service yourself.',
};

export default function CloudPage() {
  return (
    <>
      <PageBackground color='#1a1a1a' />
      <main className='mx-auto w-full max-w-[1120px] px-4 pb-20 pt-10 sm:px-6 lg:px-8'>
        <section className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-6 sm:p-8'>
          <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>Cumulus Cloud</p>
          <h1 className='mt-4 max-w-[12ch] text-[clamp(2.5rem,6vw,5.6rem)] leading-[0.9] tracking-[-0.08em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
            Hosted systems for your fork.
          </h1>
          <p className='mt-5 max-w-[70ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>
            Use the open-source app with Cumulus-hosted operational services. You keep the code and UI control. Cumulus runs the API, database operations, updates, and support path.
          </p>
          <div className='mt-6 flex flex-wrap gap-3'>
            <Button asChild variant='brand'>
              <Link href='/contact'>Talk to Cumulus</Link>
            </Button>
            <Button asChild variant='ghost' className='border border-[color:var(--muted)]/30'>
              <Link href='/docs'>Read docs</Link>
            </Button>
          </div>
        </section>

        <section className='mt-8 grid gap-5 md:grid-cols-3'>
          {[
            ['Managed API', 'Use hosted Cumulus API keys instead of running every backend service.'],
            ['Managed database', 'Let Cumulus operate the database layer while your app stays open and portable.'],
            ['Upgrade help', 'Get support moving forks and self-hosted installs onto new public releases.'],
          ].map(([title, body]) => (
            <article key={title} className='glass-surface glass-subtle glass-e2 rounded-[5.5px] p-5'>
              <h2 className='text-xl tracking-[-0.04em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
                {title}
              </h2>
              <p className='mt-3 text-sm leading-7 text-[color:var(--subtitle)]'>{body}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
