'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DailyFlowStep, MarketLocale } from '@/lib/marketing/schema';

type DailyFlowProps = {
  locale: MarketLocale;
  steps: DailyFlowStep[];
};

export function DailyFlow({ locale, steps }: DailyFlowProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) {
      return;
    }

    const cards = trackRef.current.querySelectorAll('[data-flow-step]');
    const dots = trackRef.current.querySelectorAll('[data-flow-dot]');

    animate(cards, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 460,
      delay: stagger(120),
      easing: 'easeOutExpo',
    });

    animate(dots, {
      scale: [0.3, 1],
      opacity: [0, 1],
      duration: 380,
      delay: stagger(120, { start: 120 }),
      easing: 'easeOutBack',
    });
  }, []);

  return (
    <div ref={trackRef} className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      {steps.map((step, index) => (
        <Card key={step.id} data-flow-step className='relative border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/75 opacity-0'>
          <CardHeader className='space-y-3'>
            <div className='flex items-center gap-2'>
              <span
                data-flow-dot
                className='inline-flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--muted)]/40 text-xs text-[color:var(--fg)]'
              >
                {index + 1}
              </span>
              <p className='text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]'>
                {locale === 'en' ? 'Stage' : 'Etapa'}
              </p>
            </div>
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
