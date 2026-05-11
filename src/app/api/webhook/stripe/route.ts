import Stripe from 'stripe';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe';
import { createServerSupabaseClient as createClient } from '@cumulus/auth/server';

async function updateProfileByUserOrCustomer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    userId?: string;
    customerId?: string;
    payload: Record<string, string | undefined>;
  }
): Promise<void> {
  const payload = Object.fromEntries(
    Object.entries(input.payload).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
  );

  if (Object.keys(payload).length === 0) {
    return;
  }

  if (input.userId) {
    await supabase.from('profiles').update(payload).eq('id', input.userId);
    return;
  }

  if (input.customerId) {
    await supabase.from('profiles').update(payload).eq('stripe_customer_id', input.customerId);
  }
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return new NextResponse('Stripe webhook is not configured', { status: 503 });
  }

  let stripe;

  try {
    stripe = getStripe();
  } catch (error) {
    return new NextResponse((error as Error).message, { status: 503 });
  }

  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return new NextResponse(`Webhook Error: ${(error as Error).message}`, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};

    if (session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await updateProfileByUserOrCustomer(supabase, {
        userId: metadata.userId,
        customerId: typeof subscription.customer === 'string' ? subscription.customer : undefined,
        payload: {
          stripe_customer_id: typeof subscription.customer === 'string' ? subscription.customer : undefined,
          subscription_status: subscription.status,
          tier: 'pro',
        },
      });
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;

    await updateProfileByUserOrCustomer(supabase, {
      customerId: typeof subscription.customer === 'string' ? subscription.customer : undefined,
      payload: {
        subscription_status: subscription.status,
      },
    });
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;

    await updateProfileByUserOrCustomer(supabase, {
      customerId: typeof subscription.customer === 'string' ? subscription.customer : undefined,
      payload: {
        subscription_status: subscription.status,
        tier: 'free',
      },
    });
  }

  return new NextResponse(null, { status: 200 });
}
