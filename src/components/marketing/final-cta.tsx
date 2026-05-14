import Link from 'next/link';

import { Button } from '@/components/ui/button';

type FinalCtaProps = {
  eyebrow: string;
  title: string;
  body: string;
  label: string;
  href: string;
};

export function FinalCta({ eyebrow, title, body, label, href }: FinalCtaProps) {
  return (
    <section className='mt-10 rounded-[5.5px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-[20px] sm:mt-12 sm:p-8'>
      <div className='grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end'>
        <div className='space-y-4'>
          <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--subtitle)]'>{eyebrow}</p>
          <h2 className='max-w-[18ch] text-[2.1rem] font-semibold leading-[0.98] tracking-[-0.09em] text-white sm:text-[2.7rem]'>
            {title}
          </h2>
          <p className='max-w-[62ch] text-[1rem] leading-[1.75] tracking-[-0.03em] text-[color:#a7a7a7]'>
            {body}
          </p>
        </div>
        <div className='flex'>
          <Button
            asChild
            variant='brand'
            className='min-h-12 justify-center px-6 text-xs uppercase tracking-[0.16em] sm:w-auto'
          >
            <Link href={href}>{label}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
