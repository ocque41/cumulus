import type { MarketingHomeDocument } from '@/lib/marketing/home-doc';
import type { CurrencyCode, MarketLocale } from '@/lib/marketing/schema';

import { CompanyHero } from './company-hero';
import { DomeHomeClientOrchestrator } from './dome-home-client-orchestrator';
import { FinalCta } from './final-cta';
import { ProductSurfaces } from './product-surfaces';

type DomeHomeShellProps = {
  document: MarketingHomeDocument;
  locale: MarketLocale;
  currency: CurrencyCode;
};

export function DomeHomeShell({ document, locale, currency }: DomeHomeShellProps) {
  const { hero, products, finalCta } = document;

  return (
    <div data-dome-page className='relative mx-auto w-full max-w-[1700px] px-4 pb-24 pt-4 sm:px-6 lg:px-10'>
      <DomeHomeClientOrchestrator locale={locale} currency={currency} />

      <article className='mx-auto w-full max-w-[1480px]'>
        <CompanyHero hero={hero} products={products} locale={locale} />

        {products.map((product) => (
          <ProductSurfaces key={product.id} product={product} locale={locale} />
        ))}

        <FinalCta
          eyebrow={finalCta.eyebrow}
          title={finalCta.title}
          body={finalCta.body}
          label={finalCta.label}
          href={finalCta.href}
        />
      </article>
    </div>
  );
}
