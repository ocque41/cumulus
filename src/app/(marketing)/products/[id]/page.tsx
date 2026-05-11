import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';

import { ProductSurfaces } from '@/components/marketing/product-surfaces';
import { Button } from '@/components/ui/button';
import { PageBackground } from '@/components/site/page-background';
import { PRODUCT_ORDER } from '@/lib/marketing/products';
import { loadProductDocument } from '@/lib/marketing/products/product-doc';
import type { ProductId } from '@/lib/marketing/products/types';
import {
  MARKET_CURRENCY_COOKIE,
  MARKET_LOCALE_COOKIE,
  resolveMarketRuntimeContext,
} from '@/lib/marketing/runtime';

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

function isProductId(value: string): value is ProductId {
  return (PRODUCT_ORDER as string[]).includes(value);
}

export async function generateStaticParams() {
  return PRODUCT_ORDER.map((id) => ({ id }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  if (!isProductId(id)) return {};
  const document = await loadProductDocument(id, 'en');

  return {
    title: document.frontMatter.title,
    description: document.frontMatter.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  if (!isProductId(id)) notFound();

  const cookieStore = await cookies();
  const headerStore = await headers();
  const marketContext = resolveMarketRuntimeContext({
    acceptLanguage: headerStore.get('accept-language'),
    localeCookie: cookieStore.get(MARKET_LOCALE_COOKIE)?.value ?? null,
    currencyCookie: cookieStore.get(MARKET_CURRENCY_COOKIE)?.value ?? null,
  });
  const product = await loadProductDocument(id, marketContext.locale);

  return (
    <>
      <PageBackground color='#1a1a1a' />
      <main className='mx-auto w-full max-w-[1320px] px-4 pb-20 pt-10 sm:px-6 lg:px-8'>
        <header className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-6 sm:p-8'>
          <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]'>{product.meta.licenseLabel[marketContext.locale]}</p>
          <h1 className='mt-4 max-w-[12ch] text-[clamp(2.6rem,6vw,5.8rem)] leading-[0.9] tracking-[-0.08em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]'>
            {product.frontMatter.title}
          </h1>
          <p className='mt-5 max-w-[72ch] text-sm leading-7 text-[color:var(--subtitle)] sm:text-base'>{product.frontMatter.description}</p>
          <div className='mt-6 flex flex-wrap gap-3'>
            <Button asChild variant='brand'>
              <a href={product.meta.primaryHref}>{product.meta.primaryLabel[marketContext.locale]}</a>
            </Button>
            {product.meta.secondaryHref ? (
              <Button asChild variant='ghost' className='border border-[color:var(--muted)]/30'>
                <a href={product.meta.secondaryHref}>{product.meta.secondaryLabel?.[marketContext.locale] ?? 'Learn more'}</a>
              </Button>
            ) : null}
          </div>
        </header>

        <ProductSurfaces product={product} locale={marketContext.locale} />
      </main>
    </>
  );
}
