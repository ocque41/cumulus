import type { Metadata, Viewport } from 'next';
import { cookies, headers } from 'next/headers';

import { DomeHomeShell } from '@/components/marketing/dome-home-shell';
// brand-alignment: voxel scene retired per CUMULUS-BRAND.md; restore by uncommenting if needed
// import { HomeVoxelScene } from '@/components/marketing/home-voxel-scene';
import { PageBackground } from '@/components/site/page-background';
import { loadMarketingHomeDocument } from '@/lib/marketing/home-doc';
import {
  MARKET_CURRENCY_COOKIE,
  MARKET_LOCALE_COOKIE,
  resolveMarketRuntimeContext,
} from '@/lib/marketing/runtime';

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers();
  const cookieStore = await cookies();
  const marketContext = resolveMarketRuntimeContext({
    acceptLanguage: headerStore.get('accept-language'),
    localeCookie: cookieStore.get(MARKET_LOCALE_COOKIE)?.value ?? null,
    currencyCookie: cookieStore.get(MARKET_CURRENCY_COOKIE)?.value ?? null,
  });
  const document = await loadMarketingHomeDocument(marketContext.locale);

  return {
    title: { absolute: document.title },
    description: document.description,
  };
}

export const viewport: Viewport = {
  themeColor: '#1a1a1a',
  colorScheme: 'dark',
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const marketContext = resolveMarketRuntimeContext({
    acceptLanguage: headerStore.get('accept-language'),
    localeCookie: cookieStore.get(MARKET_LOCALE_COOKIE)?.value ?? null,
    currencyCookie: cookieStore.get(MARKET_CURRENCY_COOKIE)?.value ?? null,
  });
  const document = await loadMarketingHomeDocument(marketContext.locale);

  return (
    <>
      <PageBackground color='#1a1a1a' />
      {/* brand-alignment: voxel scene retired per CUMULUS-BRAND.md; restore by uncommenting if needed */}
      {/* <HomeVoxelScene
        backgroundColor='#1a1a1a'
        baseDesktopCount={1200}
        baseMobileCount={420}
        materialPreset='liquid-glass'
        motionStrength={0.62}
        reducedMotionFallback='glass-bloom'
      /> */}
      <DomeHomeShell document={document} locale={marketContext.locale} currency={marketContext.currency} />
    </>
  );
}
