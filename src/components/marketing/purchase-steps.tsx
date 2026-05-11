'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MarketLocale, PurchaseStep } from '@/lib/marketing/schema';

type PurchaseStepsProps = {
  locale: MarketLocale;
  steps: PurchaseStep[];
};

export function PurchaseSteps({ locale, steps }: PurchaseStepsProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }

    const targets = listRef.current.querySelectorAll('[data-step]');

    animate(targets, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 500,
      delay: stagger(120),
      easing: 'easeOutExpo',
    });
  }, []);

  return (
    <div ref={listRef} className='grid gap-4 md:grid-cols-3'>
      {steps.map((step, index) => (
        <Card
          key={step.id}
          data-step
          className='border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/75 opacity-0'
        >
          <CardHeader className='space-y-2'>
            <p className='text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]'>
              {locale === 'en' ? 'Step' : 'Paso'} {index + 1}
            </p>
            <CardTitle className='text-lg text-[color:var(--fg)]'>{step.title[locale]}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm leading-6 text-[color:var(--muted)]'>{step.detail[locale]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
