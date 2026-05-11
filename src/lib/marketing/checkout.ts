import type { CurrencyCode, PlanKey } from './schema';

export type CheckoutIntentInput = {
  planKey: PlanKey;
  currency: CurrencyCode;
  locale: 'en' | 'es';
  source: string;
};

export function buildCheckoutStartHref(input: CheckoutIntentInput): string {
  const params = new URLSearchParams({
    planKey: input.planKey,
    currency: input.currency,
    locale: input.locale,
    source: input.source,
  });

  return `/checkout/start?${params.toString()}`;
}

export function buildSignupRedirectHref(redirectTo: string): string {
  const params = new URLSearchParams({ mode: 'signup', redirectTo });
  return `/login?${params.toString()}`;
}
