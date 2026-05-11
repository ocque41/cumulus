'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { MarketLocale, MarketingProductBrief } from '@/lib/marketing/schema';

type FederationGridProps = {
  locale: MarketLocale;
  products: MarketingProductBrief[];
};

export function FederationGrid({ locale, products }: FederationGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) {
      return;
    }

    const items = gridRef.current.querySelectorAll('[data-product-card]');

    animate(items, {
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 500,
      delay: stagger(90),
      easing: 'easeOutExpo',
    });
  }, []);

  return (
    <div ref={gridRef} className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {products.map((product) => (
        <Card
          key={product.product}
          data-product-card
          className='h-full border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/75 opacity-0'
        >
          <CardHeader className='space-y-2'>
            <div className='flex items-center justify-between gap-2'>
              <CardTitle className='text-lg text-[color:var(--fg)]'>{product.title[locale]}</CardTitle>
              <Badge className='border border-[color:var(--muted)]/40 bg-transparent text-[10px] uppercase'>
                {product.status}
              </Badge>
            </div>
            <CardDescription className='text-[color:var(--muted)]'>{product.oneLiner[locale]}</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm leading-6 text-[color:var(--fg)]/90'>{product.outcome[locale]}</p>
            <p className='text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]'>
              {locale === 'en' ? 'Best for' : 'Ideal para'}
            </p>
            <p className='text-sm text-[color:var(--muted)]'>{product.whoFor[locale]}</p>
            <ul className='space-y-1 text-sm text-[color:var(--muted)]'>
              {product.capabilities[locale].map((capability) => (
                <li key={capability} className='flex items-start gap-2'>
                  <span aria-hidden className='mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--fg)]/80' />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
