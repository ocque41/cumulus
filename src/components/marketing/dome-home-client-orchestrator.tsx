'use client';

import { useEffect, useMemo, useRef } from 'react';

import {
  useHeroTimeline,
  useIdleFloat,
  useRevealOnIntersect,
  type HeroTimelineStep,
} from '@/components/animation';
import { trackMarketingEvent } from '@/lib/marketing/events';
import type { CurrencyCode, MarketLocale } from '@/lib/marketing/schema';

type DomeHomeClientOrchestratorProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
};

const HERO_STEPS: HeroTimelineStep[] = [
  {
    selector: '[data-dome-hero-eyebrow]',
    params: { opacity: [0, 1], translateY: [18, 0] },
  },
  {
    selector: '[data-dome-hero-title]',
    params: {
      opacity: [0, 1],
      translateY: [28, 0],
      filter: ['blur(10px)', 'blur(0px)'],
    },
    offset: '-=520',
  },
  {
    selector: '[data-dome-hero-copy]',
    params: { opacity: [0, 1], translateY: [24, 0] },
    offset: '-=480',
  },
  {
    selector: '[data-dome-hero-cta]',
    params: { opacity: [0, 1], translateY: [20, 0] },
    offset: '-=420',
  },
];

export function DomeHomeClientOrchestrator({ locale, currency }: DomeHomeClientOrchestratorProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    rootRef.current = document.querySelector<HTMLElement>('[data-dome-page]');
    trackMarketingEvent('home_view', { locale, currency, source: 'home' });
  }, [locale, currency]);

  const idleOptions = useMemo(() => ({ selector: '[data-dome-idle]' }), []);
  const revealOptions = useMemo(
    () => ({ groupSelector: '[data-dome-reveal-group]', revealSelector: '[data-dome-reveal]' }),
    []
  );

  useHeroTimeline(rootRef, HERO_STEPS);
  useIdleFloat(rootRef, idleOptions);
  useRevealOnIntersect(rootRef, revealOptions);

  return null;
}
