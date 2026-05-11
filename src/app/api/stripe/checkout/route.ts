import { NextRequest, NextResponse } from 'next/server';

import { normalizeCurrency } from '@/lib/marketing/currency';
import { parsePlanKey } from '@/lib/marketing/pricing';
import { getCheckoutMode, getStripePriceId } from '@/lib/marketing/pricing-server';
import type { PlanKey } from '@/lib/marketing/schema';
import { getStripe } from '@/lib/stripe';
import { createServerSupabaseClient as createClient } from '@cumulus/auth/server';

type CheckoutRequestBody = {
  priceId?: string;
  planKey?: string;
  currency?: string;
  successUrl?: string;
  cancelUrl?: string;
  source?: string;
};

function resolvePlanFromPayload(payload: CheckoutRequestBody): {
  priceId: string;
  mode: 'subscription';
  planKey?: PlanKey;
  currency?: 'USD' | 'EUR' | 'GBP';
} {
  if (payload.priceId) {
    return {
      priceId: payload.priceId,
      mode: 'subscription',
    };
  }

  const planKey = parsePlanKey(payload.planKey);
  if (!planKey) {
    throw new Error('Invalid planKey for checkout.');
  }

  const currency = normalizeCurrency(payload.currency);
  if (!currency) {
    throw new Error('Currency must be USD, EUR, or GBP.');
  }

  return {
    priceId: getStripePriceId(planKey, currency),
    mode: getCheckoutMode(planKey),
    planKey,
    currency,
  };
}

export async function POST(req: NextRequest) {
  let stripe;

  try {
    stripe = getStripe();
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 503 });
  }

  try {
    const payload = (await req.json()) as CheckoutRequestBody;
    const planConfig = resolvePlanFromPayload(payload);

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, full_name, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: profile?.full_name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      });

      customerId = customer.id;

      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get('origin') || 'https://cumulush.com';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      mode: planConfig.mode,
      success_url: payload.successUrl || `${baseUrl}/dashboard/system?success=true`,
      cancel_url: payload.cancelUrl || `${baseUrl}/?canceled=true`,
      metadata: {
        userId: user.id,
        planKey: planConfig.planKey || 'legacy_price_id',
        currency: planConfig.currency || 'legacy',
        source: payload.source || 'unspecified',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
