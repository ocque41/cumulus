import type { Metadata } from 'next';
import { cookies, headers } from 'next/headers';

import { ModelsConversionShell } from '@/components/marketing/models-conversion-shell';
import { PageBackground } from '@/components/site/page-background';
import {
  MARKET_CURRENCY_COOKIE,
  MARKET_LOCALE_COOKIE,
  resolveMarketRuntimeContext,
} from '@/lib/marketing/runtime';

export const metadata: Metadata = {
  title: 'Plans and Cloud API',
  description: 'Compare Cumulus Cloud and self-hosted paths.',
};

export default async function ModelsPage() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const marketContext = resolveMarketRuntimeContext({
    acceptLanguage: headerStore.get('accept-language'),
    localeCookie: cookieStore.get(MARKET_LOCALE_COOKIE)?.value ?? null,
    currencyCookie: cookieStore.get(MARKET_CURRENCY_COOKIE)?.value ?? null,
  });

  return (
    <>
      <PageBackground color='#1a1a1a' />
      <ModelsConversionShell locale={marketContext.locale} currency={marketContext.currency} />
    </>
  );
}
