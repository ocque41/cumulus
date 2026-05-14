import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { t } from '@/lib/marketing/i18n';
import { PHRASES } from '@/lib/marketing/phrases';
import type { CompanyHeroContent, ProductDocument } from '@/lib/marketing/products/types';
import type { MarketLocale } from '@/lib/marketing/schema';

type CompanyHeroProps = {
  hero: CompanyHeroContent;
  products: ProductDocument[];
  locale: MarketLocale;
};

export function CompanyHero({ hero, products, locale }: CompanyHeroProps) {
  return (
    <section className='grid min-h-[clamp(30rem,76svh,42rem)] items-start gap-10 pb-14 pt-6 lg:min-h-[clamp(34rem,78svh,46rem)] lg:grid-cols-[minmax(0,1.08fr)_minmax(300px,0.92fr)] lg:items-end lg:gap-12 lg:pt-8'>
      <div className='space-y-8 pb-4 sm:space-y-10 lg:pb-10'>
        <div className='space-y-4'>
          <p className='w-fit rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-[color:var(--fg)]'>
            {hero.eyebrow}
          </p>
          <h1 className='max-w-[9ch] text-[clamp(3.2rem,8vw,6.6rem)] leading-[0.9] tracking-[-0.09em] text-[color:var(--fg)] [font-family:var(--type-title-family)] [font-weight:var(--type-title-weight)]'>
            {hero.title}
          </h1>
        </div>

        <div className='max-w-[64rem] space-y-4'>
          <p className='max-w-[56rem] text-[1.22rem] font-semibold leading-[1.45] tracking-[-0.06em] text-[color:var(--fg)] sm:text-[1.45rem]'>
            {hero.subtitle}
          </p>
          <p className='max-w-[60rem] text-[1rem] leading-[1.75] tracking-[-0.03em] text-[color:rgba(245,245,245,0.88)] sm:text-[1.06rem]'>
            {hero.body}
          </p>
        </div>

        <ul className='flex flex-wrap gap-3'>
          {hero.scanPoints.map((point) => (
            <li
              key={point}
              className='rounded-full border border-white/20 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[color:var(--fg)] sm:text-[0.78rem]'
            >
              {point}
            </li>
          ))}
        </ul>

        <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
          <Button
            asChild
            variant='brand'
            className='min-h-12 justify-center px-6 text-xs uppercase tracking-[0.16em] sm:w-auto'
          >
            <Link href={hero.primaryHref}>{hero.primaryLabel}</Link>
          </Button>
          <Button
            asChild
            variant='ghost'
            className='min-h-12 justify-center rounded-full border border-white/25 px-6 text-xs uppercase tracking-[0.16em] text-[color:var(--fg)] hover:border-white/40 hover:text-white sm:w-auto'
          >
            <Link href={hero.secondaryHref}>{hero.secondaryLabel}</Link>
          </Button>
        </div>

        {products.length > 0 ? (
          <nav
            aria-label={t(locale, PHRASES.jumpToProduct)}
            className='flex flex-wrap gap-2 pt-2'
          >
            {products.map((product) => (
              <Link
                key={product.id}
                href={`#${product.id}`}
                className='rounded-full border border-white/20 bg-white/[0.03] px-3 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-[color:var(--fg)] transition-colors hover:border-white/40 hover:text-white'
              >
                {product.meta.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {hero.sideLines.length > 0 ? (
        <div className='hidden lg:flex min-h-full items-end justify-end pb-6'>
          <div className='space-y-5 text-right'>
            {hero.sideLines.map((line) => (
              <p
                key={line}
                className='max-w-[22rem] text-[0.82rem] uppercase leading-[1.7] tracking-[0.2em] text-[color:rgba(245,245,245,0.78)]'
              >
                {line}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
