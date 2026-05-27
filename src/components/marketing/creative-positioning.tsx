'use client';

import { useEffect, useRef } from 'react';
import { animate, stagger } from 'animejs';

import { Card } from '@/components/ui/card';
import type { MarketLocale } from '@/lib/marketing/schema';

type CreativePositioningProps = {
  locale: MarketLocale;
  title: string;
  body: string;
};

const signalChips = {
  en: ['Plain command', 'Template choices', 'Relay auth', 'Cumulus DB modes'],
  es: ['Comando claro', 'Opciones template', 'Auth Relay', 'Modos Cumulus DB'],
};

export function CreativePositioning({ locale, title, body }: CreativePositioningProps) {
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!frameRef.current) {
      return;
    }

    const headline = frameRef.current.querySelector('[data-creative-core]');
    const chips = frameRef.current.querySelectorAll('[data-creative-chip]');

    if (headline) {
      animate(headline, {
        opacity: [0, 1],
        scale: [0.96, 1],
        duration: 620,
        easing: 'easeOutExpo',
      });
    }

    animate(chips, {
      opacity: [0, 1],
      translateY: [14, 0],
      duration: 420,
      delay: stagger(90, { start: 160 }),
      easing: 'easeOutExpo',
    });
  }, []);

  return (
    <div ref={frameRef} className='relative overflow-hidden rounded-[5.5px] border border-[color:var(--muted)]/35 bg-[color:var(--bg)]/70 p-6 sm:p-8'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]' />
      <div className='relative grid gap-5 lg:grid-cols-[1.2fr_1fr]'>
        <Card data-creative-core className='border border-white/20 bg-black/35 p-6 opacity-0'>
          <h3 className='text-2xl font-semibold tracking-[-0.02em] text-[color:var(--fg)]'>{title}</h3>
          <p className='mt-4 text-sm leading-7 text-[color:var(--muted)]'>{body}</p>
        </Card>

        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-1'>
          {signalChips[locale].map((chip) => (
            <div
              key={chip}
              data-creative-chip
              className='rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/50 px-4 py-3 text-sm text-[color:var(--fg)] opacity-0'
            >
              {chip}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
