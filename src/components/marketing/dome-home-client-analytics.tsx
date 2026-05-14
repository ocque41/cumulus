'use client';

import { useEffect } from 'react';

import { trackMarketingEvent } from '@/lib/marketing/events';
import type { CurrencyCode, MarketLocale } from '@/lib/marketing/schema';

type DomeHomeClientAnalyticsProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
};

export function DomeHomeClientAnalytics({ locale, currency }: DomeHomeClientAnalyticsProps) {
  useEffect(() => {
    trackMarketingEvent('home_view', { locale, currency, source: 'home' });
  }, [locale, currency]);

  return null;
}
