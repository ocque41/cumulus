'use client';

import { useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trackMarketingEvent } from '@/lib/marketing/events';
import type { CurrencyCode, MarketLocale, MarketingProductBrief, SelectorPersona } from '@/lib/marketing/schema';

type ProductSelectorProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
  personas: SelectorPersona[];
  products: MarketingProductBrief[];
  source: string;
};

export function ProductSelector({ locale, currency, personas, products, source }: ProductSelectorProps) {
  const productsById = useMemo(() => {
    return new Map(products.map((product) => [product.product, product]));
  }, [products]);

  return (
    <Tabs defaultValue={personas[0]?.id} className='space-y-5'>
      <TabsList className='grid h-auto w-full grid-cols-1 gap-2 bg-transparent p-0 sm:grid-cols-2'>
        {personas.map((persona) => (
          <TabsTrigger
            key={persona.id}
            value={persona.id}
            className='h-auto rounded-[5.5px] border border-[color:var(--muted)]/35 bg-[color:var(--bg)]/65 px-4 py-3 text-left text-sm text-[color:var(--fg)] data-[state=active]:border-white/35 data-[state=active]:bg-[color:var(--bg)]'
            onClick={() => {
              trackMarketingEvent('product_selector_choice', {
                locale,
                currency,
                source,
                persona: persona.id,
              });
            }}
          >
            <span>{persona.label[locale]}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      {personas.map((persona) => (
        <TabsContent key={persona.id} value={persona.id} className='outline-none'>
          <Card className='border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/75'>
            <CardHeader>
              <CardTitle className='text-xl text-[color:var(--fg)]'>{persona.label[locale]}</CardTitle>
              <p className='text-sm leading-6 text-[color:var(--muted)]'>{persona.description[locale]}</p>
            </CardHeader>
            <CardContent className='grid gap-3 sm:grid-cols-2'>
              {persona.recommendedProducts.map((productId) => {
                const product = productsById.get(productId);
                if (!product) {
                  return null;
                }

                return (
                  <div
                    key={product.product}
                    className='rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/60 p-4'
                  >
                    <div className='mb-2 flex items-center justify-between gap-2'>
                      <p className='text-sm font-semibold text-[color:var(--fg)]'>{product.title[locale]}</p>
                      <Badge className='border border-[color:var(--muted)]/40 bg-transparent text-[10px] uppercase'>
                        {product.status}
                      </Badge>
                    </div>
                    <p className='text-xs leading-5 text-[color:var(--muted)]'>{product.oneLiner[locale]}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
