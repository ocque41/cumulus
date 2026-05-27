import type { CurrencyCode, PlanKey } from './schema';

export function getStripePriceId(planKey: PlanKey, currency: CurrencyCode): string {
  throw new Error(`Plan ${planKey} is free and does not use Stripe checkout for ${currency}.`);
}

export function getCheckoutMode(planKey: PlanKey): 'subscription' {
  throw new Error(`Plan ${planKey} is free and does not use Stripe checkout.`);
}
