'use client';

import { track } from '@vercel/analytics';

import type { CurrencyCode, MarketLocale, PlanKey } from './schema';

export type MarketingEventName =
  | 'home_view'
  | 'home_primary_cta_click'
  | 'product_selector_choice'
  | 'models_view'
  | 'plan_card_click'
  | 'checkout_intent_created'
  | 'checkout_redirect_started'
  | 'contact_sales_click';

export type MarketingEventPayload = {
  locale?: MarketLocale;
  currency?: CurrencyCode;
  planKey?: PlanKey;
  source?: string;
  persona?: string;
};

export function trackMarketingEvent(name: MarketingEventName, payload: MarketingEventPayload = {}): void {
  try {
    track(name, payload);
  } catch {
    // Never block UI for telemetry issues.
  }
}
