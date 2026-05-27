'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  TypographyBlockquote,
  TypographyEyebrow,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyLarge,
  TypographyLead,
  TypographyList,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from '@/components/ui/typography';
import { accessPoints, dailyFlowSteps, homeContent, selectorPersonas, visionLines } from '@/lib/marketing/content';
import { MARKET_CURRENCY_COOKIE } from '@/lib/marketing/currency';
import { trackMarketingEvent } from '@/lib/marketing/events';
import { MARKET_LOCALE_COOKIE } from '@/lib/marketing/i18n';
import { getMarketingProductBriefs } from '@/lib/marketing/product-briefs';
import type { CurrencyCode, MarketLocale, MarketingProductBrief } from '@/lib/marketing/schema';

type HomeConversionShellProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
};

const products = getMarketingProductBriefs();

const statusLabel: Record<MarketingProductBrief['status'], Record<MarketLocale, string>> = {
  active: {
    en: 'Active',
    es: 'Activo',
  },
  building: {
    en: 'Building',
    es: 'En construccion',
  },
  'coming-soon': {
    en: 'Coming soon',
    es: 'Proximamente',
  },
};

const heroScanPoints: Record<MarketLocale, string[]> = {
  en: [
    'Free local database path.',
    'Scoped tokens for agents.',
  ],
  es: [
    'Camino local gratis.',
    'Tokens con scope para agentes.',
  ],
};

const jumpLinks: Record<MarketLocale, Array<{ href: string; label: string }>> = {
  en: [
    { href: '#selector', label: 'Agent needs' },
    { href: '#federation', label: 'Database surface' },
    { href: '#flow', label: 'Agent flow' },
    { href: '#access', label: 'Access' },
  ],
  es: [
    { href: '#selector', label: 'Necesidades de agente' },
    { href: '#federation', label: 'Superficie de base' },
    { href: '#flow', label: 'Flujo de agente' },
    { href: '#access', label: 'Acceso' },
  ],
};

export function HomeConversionShell({ locale, currency }: HomeConversionShellProps) {
  useEffect(() => {
    document.cookie = `${MARKET_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${MARKET_CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;

    trackMarketingEvent('home_view', { locale, currency, source: 'home' });
  }, [locale, currency]);

  return (
    <div className='relative mx-auto w-full max-w-[1760px] px-4 pb-20 pt-8 sm:px-6 lg:px-8'>
      <article className='mx-auto max-w-[1120px] space-y-8 sm:space-y-10 lg:space-y-12'>
        <header className='glass-surface glass-standard glass-e3 space-y-6 rounded-[5.5px] p-5 sm:p-8 lg:p-10'>
          <div className='space-y-4'>
            <TypographyEyebrow>{homeContent.heroEyebrow[locale]}</TypographyEyebrow>
            <TypographyH1>{homeContent.heroTitle[locale]}</TypographyH1>
            <TypographyLead>{homeContent.heroSubtitle[locale]}</TypographyLead>
          </div>

          <ul className='grid gap-2 text-sm tracking-[-0.02em] text-[color:var(--subtitle)] sm:text-base md:grid-cols-3'>
            {heroScanPoints[locale].map((point) => (
              <li key={point} className='glass-surface glass-subtle glass-e1 rounded-lg px-3 py-2'>
                {point}
              </li>
            ))}
          </ul>

          <div className='flex flex-col gap-3 pt-1 sm:flex-row sm:items-center'>
            <Button
              asChild
              variant='brand'
              className='min-h-11 w-full justify-center px-6 text-xs uppercase tracking-[0.12em] sm:w-auto sm:text-sm'
              onClick={() => {
                trackMarketingEvent('home_primary_cta_click', {
                  locale,
                  currency,
                  source: 'home_hero',
                });
              }}
            >
              <Link href='/docs'>{homeContent.heroPrimaryCta[locale]}</Link>
            </Button>
          </div>

          <nav
            aria-label={locale === 'en' ? 'Home sections' : 'Secciones de inicio'}
            className='flex flex-wrap gap-2 border-t border-[color:var(--muted)]/20 pt-4'
          >
            {jumpLinks[locale].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className='rounded-full border border-[color:var(--muted)]/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--subtitle)] transition-colors hover:text-[color:var(--fg)]'
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <section className='glass-surface glass-subtle glass-e2 space-y-5 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <TypographyEyebrow>{locale === 'en' ? 'Vision' : 'Vision'}</TypographyEyebrow>
          <TypographyH2 className='border-none pb-0'>{visionLines[locale].title}</TypographyH2>
          <TypographyP>{visionLines[locale].body}</TypographyP>
        </section>

        <section id='selector' className='glass-surface glass-subtle glass-e2 space-y-6 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end'>
            <div className='space-y-3'>
              <TypographyEyebrow>{locale === 'en' ? 'Role Selector' : 'Selector de roles'}</TypographyEyebrow>
              <TypographyH2 className='border-none pb-0'>{homeContent.selectorTitle[locale]}</TypographyH2>
            </div>
            <TypographyMuted className='max-w-none'>{homeContent.selectorDescription[locale]}</TypographyMuted>
          </div>
          <div className='grid gap-5 xl:grid-cols-2'>
            {selectorPersonas.map((persona) => {
              const recommendedPath = persona.recommendedProducts
                .map((productKey) => products.find((product) => product.product === productKey)?.title[locale] ?? productKey)
                .join(' -> ');

              return (
                <section key={persona.id} className='glass-surface glass-standard glass-e2 flex h-full flex-col gap-4 rounded-[5.5px] p-5'>
                  <TypographyH3>{persona.label[locale]}</TypographyH3>
                  <TypographyP>{persona.description[locale]}</TypographyP>
                  <div className='glass-surface glass-subtle glass-e1 rounded-lg p-3'>
                    <TypographySmall className='uppercase tracking-[0.12em] text-[color:var(--subtitle)]'>
                      {locale === 'en' ? 'Recommended path' : 'Ruta recomendada'}
                    </TypographySmall>
                    <TypographyP className='mt-1 text-sm sm:text-base'>{recommendedPath}</TypographyP>
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section id='federation' className='glass-surface glass-subtle glass-e2 space-y-6 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end'>
            <div className='space-y-3'>
              <TypographyEyebrow>{locale === 'en' ? 'Federation Map' : 'Mapa de federacion'}</TypographyEyebrow>
              <TypographyH2 className='border-none pb-0'>{homeContent.federationTitle[locale]}</TypographyH2>
            </div>
            <TypographyMuted className='max-w-none'>{homeContent.federationDescription[locale]}</TypographyMuted>
          </div>
          <div className='grid gap-4 xl:grid-cols-2'>
            {products.map((product) => (
              <section key={product.product} className='glass-surface glass-standard glass-e2 flex h-full flex-col gap-3 rounded-[5.5px] p-5'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <TypographyH3>{product.title[locale]}</TypographyH3>
                  <TypographySmall className='rounded-full border border-[color:var(--muted)]/30 px-3 py-1 uppercase tracking-[0.12em] text-[color:var(--subtitle)]'>
                    {statusLabel[product.status][locale]}
                  </TypographySmall>
                </div>
                <TypographyP>{product.oneLiner[locale]}</TypographyP>
                <TypographyMuted>{product.outcome[locale]}</TypographyMuted>
                <TypographySmall className='uppercase tracking-[0.08em]'>
                  {locale === 'en' ? 'Who this is for:' : 'Para quien es:'} {product.whoFor[locale]}
                </TypographySmall>
                <TypographyList className='my-0 space-y-1.5 text-sm'>
                  {product.capabilities[locale].map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </TypographyList>
              </section>
            ))}
          </div>
        </section>

        <section id='flow' className='glass-surface glass-subtle glass-e2 space-y-5 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end'>
            <div className='space-y-3'>
              <TypographyEyebrow>{locale === 'en' ? 'Operating Rhythm' : 'Ritmo operativo'}</TypographyEyebrow>
              <TypographyH2 className='border-none pb-0'>{homeContent.flowTitle[locale]}</TypographyH2>
            </div>
            <TypographyMuted className='max-w-none'>{homeContent.flowDescription[locale]}</TypographyMuted>
          </div>
          <ol className='grid gap-4 md:grid-cols-2'>
            {dailyFlowSteps.map((step, index) => (
              <li key={step.id} className='glass-surface glass-standard glass-e1 rounded-[5.5px] p-5'>
                <TypographySmall className='uppercase tracking-[0.14em] text-[color:var(--subtitle)]'>
                  {locale === 'en' ? 'Step' : 'Paso'} {index + 1}
                </TypographySmall>
                <TypographyLarge className='mt-2'>{step.title[locale]}</TypographyLarge>
                <TypographyP className='mt-2'>{step.detail[locale]}</TypographyP>
              </li>
            ))}
          </ol>
        </section>

        <section id='access' className='glass-surface glass-subtle glass-e2 space-y-5 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <TypographyEyebrow>{locale === 'en' ? 'Access Layer' : 'Capa de acceso'}</TypographyEyebrow>
          <TypographyH2 className='border-none pb-0'>{homeContent.accessTitle[locale]}</TypographyH2>
          <TypographyMuted>{homeContent.accessDescription[locale]}</TypographyMuted>
          <TypographyList className='my-0'>
            {accessPoints[locale].map((point) => (
              <li key={point}>{point}</li>
            ))}
          </TypographyList>
          <TypographyBlockquote>
            {locale === 'en'
              ? 'All statements are tied to current product docs and currently shipped behavior.'
              : 'Todas las afirmaciones estan ligadas a la documentacion actual y al comportamiento ya disponible.'}
          </TypographyBlockquote>
        </section>

        <section className='glass-surface glass-standard glass-e3 space-y-5 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <TypographyEyebrow>{locale === 'en' ? 'Next Step' : 'Siguiente paso'}</TypographyEyebrow>
          <TypographyH2 className='border-none pb-0'>{homeContent.pricingBridgeTitle[locale]}</TypographyH2>
          <TypographyP>{homeContent.pricingBridgeDescription[locale]}</TypographyP>
          <Button asChild variant='brand' className='min-h-11 w-full justify-center px-6 text-xs uppercase tracking-[0.12em] sm:w-auto sm:text-sm'>
            <Link href='/models'>{homeContent.pricingBridgeCta[locale]}</Link>
          </Button>
        </section>
      </article>
    </div>
  );
}
