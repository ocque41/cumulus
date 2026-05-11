'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { animate } from 'animejs';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatAmount } from '@/lib/marketing/currency';
import { trackMarketingEvent } from '@/lib/marketing/events';
import type { CurrencyCode, MarketLocale, PlanDefinition, PlanKey } from '@/lib/marketing/schema';
import { cn } from '@/lib/utils';

type PlanCardProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
  plan: PlanDefinition;
  href?: string;
  featured?: boolean;
  source: string;
};

const statusLabels: Record<PlanDefinition['status'], Record<MarketLocale, string>> = {
  active: {
    en: 'Active',
    es: 'Activo',
  },
  building: {
    en: 'Building',
    es: 'En construccion',
  },
};

function priceLine(plan: PlanDefinition, currency: CurrencyCode, locale: MarketLocale): string {
  if (plan.amount === null) {
    return '--';
  }

  const amount = formatAmount(plan.amount, currency, locale);
  return locale === 'en' ? `${amount}/month` : `${amount}/mes`;
}

function toTrackingPlanKey(planKey: PlanKey): PlanKey {
  return planKey;
}

export function PlanCard({ locale, currency, plan, href, featured = false, source }: PlanCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) {
      return;
    }

    animate(cardRef.current, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 550,
      easing: 'easeOutExpo',
    });
  }, []);

  const handleClick = () => {
    trackMarketingEvent('plan_card_click', {
      locale,
      currency,
      planKey: toTrackingPlanKey(plan.key),
      source,
    });

    trackMarketingEvent('checkout_intent_created', {
      locale,
      currency,
      planKey: plan.key,
      source,
    });

    trackMarketingEvent('checkout_redirect_started', {
      locale,
      currency,
      planKey: plan.key,
      source,
    });
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        'h-full border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/80 opacity-0 backdrop-blur',
        featured && 'border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]'
      )}
    >
      <CardHeader className='space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <CardTitle className='text-2xl tracking-[-0.02em] text-[color:var(--fg)]'>{plan.title[locale]}</CardTitle>
          <Badge variant='outline' className='border border-[color:var(--muted)]/40 bg-[color:var(--bg)] text-xs'>
            {statusLabels[plan.status][locale]}
          </Badge>
        </div>
        <CardDescription className='text-[color:var(--muted)]'>{plan.summary[locale]}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-5'>
        <p className='text-3xl font-semibold tracking-[-0.02em] text-[color:var(--fg)]'>{priceLine(plan, currency, locale)}</p>
        <ul className='space-y-2 text-sm text-[color:var(--muted)]'>
          {plan.benefits[locale].map((benefit) => (
            <li key={benefit} className='flex items-start gap-2'>
              <span aria-hidden className='mt-1 inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--fg)]/80' />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {href ? (
          <Button asChild variant='brand' className='w-full justify-center rounded-full text-sm' onClick={handleClick}>
            <Link href={href}>{plan.ctaLabel[locale]}</Link>
          </Button>
        ) : (
          <Button
            type='button'
            variant='brand'
            className='w-full justify-center rounded-full text-sm'
            onClick={handleClick}
            disabled
          >
            {plan.ctaLabel[locale]}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
