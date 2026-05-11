'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { MARKET_CURRENCY_COOKIE, normalizeCurrency } from '@/lib/marketing/currency';
import { trackMarketingEvent } from '@/lib/marketing/events';
import { MARKET_LOCALE_COOKIE, normalizeMarketLocale } from '@/lib/marketing/i18n';
import { parsePlanKey } from '@/lib/marketing/pricing';

export default function CheckoutStartPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const planKey = parsePlanKey(query.get('planKey'));
    const currency = normalizeCurrency(query.get('currency'));
    const locale = normalizeMarketLocale(query.get('locale')) ?? 'en';
    const source = query.get('source') ?? 'checkout_start';

    if (!planKey || !currency) {
      router.replace('/');
      return;
    }

    document.cookie = `${MARKET_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${MARKET_CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;

    trackMarketingEvent('checkout_redirect_started', {
      locale,
      currency,
      planKey,
      source,
    });

    const startCheckout = async () => {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          currency,
          source,
        }),
      });

      if (response.status === 401) {
        const redirectTo = `${window.location.pathname}${window.location.search}`;
        router.replace(`/login?mode=signup&redirectTo=${encodeURIComponent(redirectTo)}`);
        return;
      }

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.url) {
        setError(payload?.error || 'Unable to start checkout. Please try again.');
        return;
      }

      window.location.assign(payload.url as string);
    };

    void startCheckout();
  }, [router]);

  return (
    <div className='mx-auto flex min-h-[70vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center'>
      <p className='text-xs uppercase tracking-[0.22em] text-[color:var(--muted)]'>Checkout</p>
      <h1 className='text-3xl font-semibold tracking-[-0.03em] text-[color:var(--fg)]'>Preparing your secure checkout...</h1>
      <p className='max-w-xl text-sm text-[color:var(--muted)]'>
        We are routing your account to payment with the selected plan and currency.
      </p>
      {error ? (
        <>
          <p className='text-sm text-red-300'>{error}</p>
          <Button asChild variant='brand' className='rounded-full px-6 py-5 text-sm'>
            <Link href='/'>Back to Home</Link>
          </Button>
        </>
      ) : null}
    </div>
  );
}
