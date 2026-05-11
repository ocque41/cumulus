import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripeSecretKey(): string {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to enable Stripe routes.');
  }

  return stripeSecretKey;
}

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
    apiVersion: '2025-02-24.acacia', // Use latest or what user has.
    typescript: true,
    });
  }

  return stripeClient;
}
