import type { Metadata } from 'next';
import Link from 'next/link';

import { PageBackground } from '@/components/site/page-background';

export const metadata: Metadata = {
  title: 'Docs',
  description: 'Cumulus public documentation for cloud, self-hosted, and terminal deployments.',
};

const repositoryUrl = (process.env.NEXT_PUBLIC_REPOSITORY_URL || 'https://github.com/cumulus/cumulus').replace(/\/$/, '');

const docs = [
  {
    href: `${repositoryUrl}/blob/main/docs/self-hosting.md`,
    title: 'Self-hosting',
    body: 'Run the app, auth provider, database, and Cumulus DB service yourself.',
  },
  {
    href: `${repositoryUrl}/blob/main/docs/public-release.md`,
    title: 'Public release checklist',
    body: 'Check for secrets, private provider details, local runtime data, and unsafe admin access.',
  },
  {
    href: `${repositoryUrl}/blob/main/docs/private-overlay.md`,
    title: 'Private production overlay',
    body: 'Keep production close to public while separating secrets and private admin systems.',
  },
  {
    href: `${repositoryUrl}/blob/main/docs/terminal-site.md`,
    title: 'Terminal site',
    body: 'Run the Cumulus website from a terminal with npx cumulush.',
  },
];

export default function DocsPage() {
  return (
    <>
      <PageBackground color='#1a1a1a' />
      <main className='mx-auto w-full max-w-[1120px] px-4 pb-20 pt-10 sm:px-6 lg:px-8'>
        <header className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-6 sm:p-8'>
          <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>Docs</p>
          <h1 className='mt-4 text-[clamp(2.4rem,6vw,5.2rem)] leading-[0.92] tracking-[-0.07em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
            Build public. Run private.
          </h1>
          <p className='mt-5 max-w-[68ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>
            Start with Cumulus Cloud/API, or self-host the full stack when you need control.
          </p>
        </header>

        <section className='mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4'>
          {docs.map((doc) => (
            <Link key={doc.href} href={doc.href} className='glass-surface glass-subtle glass-e2 rounded-[5.5px] p-5 transition hover:bg-white/[0.06]'>
              <h2 className='text-xl tracking-[-0.04em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
                {doc.title}
              </h2>
              <p className='mt-3 text-sm leading-7 text-[color:var(--subtitle)]'>{doc.body}</p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
