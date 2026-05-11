import { NextRequest, NextResponse } from 'next/server';

import { getStripe } from '@/lib/stripe';
import { createServerSupabaseClient as createClient } from '@cumulus/auth/server';

export async function POST(req: NextRequest) {
  let stripe;

  try {
    stripe = getStripe();
  } catch (error) {
    return new NextResponse((error as Error).message, { status: 503 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return new NextResponse('No Stripe customer found', { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${req.headers.get('origin')}/dashboard/system`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[STRIPE_PORTAL]', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
