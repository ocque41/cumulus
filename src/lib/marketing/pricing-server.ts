import type { CurrencyCode, PlanKey } from './schema';

function getRequiredPriceId(envName: string, fallbackEnvName?: string): string {
  const value = process.env[envName] || (fallbackEnvName ? process.env[fallbackEnvName] : undefined);

  if (!value) {
    throw new Error(`Missing Stripe price id: set ${envName}${fallbackEnvName ? ` or ${fallbackEnvName}` : ''}`);
  }

  return value;
}

export function getStripePriceId(planKey: PlanKey, currency: CurrencyCode): string {
  if (currency === 'GBP') {
    return getRequiredPriceId('STRIPE_PRICE_ID_PRO_MONTHLY_GBP', 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY_GBP');
  }

  if (currency === 'EUR') {
    return getRequiredPriceId('STRIPE_PRICE_ID_PRO_MONTHLY_EUR', 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO_MONTHLY_EUR');
  }

  return getRequiredPriceId('STRIPE_PRICE_ID_PRO_MONTHLY_USD', 'NEXT_PUBLIC_STRIPE_PRICE_ID_PRO');
}

export function getCheckoutMode(planKey: PlanKey): 'subscription' {
  return 'subscription';
}
