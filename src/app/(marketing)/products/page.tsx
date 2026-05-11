import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies, headers } from 'next/headers';

import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/site/page-background';
import { PRODUCT_ORDER } from '@/lib/marketing/products';
import { loadProductDocument } from '@/lib/marketing/products/product-doc';
import {
  MARKET_CURRENCY_COOKIE,
  MARKET_LOCALE_COOKIE,
  resolveMarketRuntimeContext,
} from '@/lib/marketing/runtime';

export const metadata: Metadata = {
  title: 'Products',
  description: 'Open-source Cumulus products and hosted Cumulus Cloud paths.',
};

export default async function ProductsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const marketContext = resolveMarketRuntimeContext({
    acceptLanguage: headerStore.get('accept-language'),
    localeCookie: cookieStore.get(MARKET_LOCALE_COOKIE)?.value ?? null,
    currencyCookie: cookieStore.get(MARKET_CURRENCY_COOKIE)?.value ?? null,
  });
  const products = await Promise.all(PRODUCT_ORDER.map((id) => loadProductDocument(id, marketContext.locale)));

  return (
    <>
      <PageBackground color='#1a1a1a' />
      <main className='mx-auto w-full max-w-[1200px] px-4 pb-20 pt-10 sm:px-6 lg:px-8'>
        <header className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-6 sm:p-8'>
          <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>Products</p>
          <h1 className='mt-4 max-w-[12ch] text-[clamp(2.4rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.07em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
            Open code. Hosted path.
          </h1>
          <p className='mt-5 max-w-[68ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>
            Use Cumulus Cloud/API for the fastest setup, or self-host the same public building blocks with your own infrastructure.
          </p>
        </header>

        <section className='mt-8 grid gap-5 md:grid-cols-2'>
          {products.map((product) => (
            <article key={product.id} className='glass-surface glass-subtle glass-e2 flex flex-col rounded-[5.5px] p-5'>
              <p className='text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]'>{product.meta.statusLabel[marketContext.locale]}</p>
              <h2 className='mt-3 text-2xl tracking-[-0.04em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
                {product.meta.name}
              </h2>
              <p className='mt-3 flex-1 text-sm leading-7 text-[color:var(--subtitle)]'>{product.frontMatter.description}</p>
              <div className='mt-5 flex flex-wrap gap-3'>
                <Button asChild variant='brand'>
                  <Link href={`/products/${product.id}`}>View product</Link>
                </Button>
                <Button asChild variant='ghost' className='border border-[color:var(--muted)]/30'>
                  <Link href='/models'>Cloud options</Link>
                </Button>
              </div>
            </article>
          ))}
        </section>
      </main>
    </>
  );
}
