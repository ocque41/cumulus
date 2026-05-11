'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
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
  TypographyTable,
} from '@/components/ui/typography';
import { buildCheckoutStartHref } from '@/lib/marketing/checkout';
import { modelsContent, purchaseSteps } from '@/lib/marketing/content';
import { formatAmount, MARKET_CURRENCY_COOKIE } from '@/lib/marketing/currency';
import { trackMarketingEvent } from '@/lib/marketing/events';
import { MARKET_LOCALE_COOKIE } from '@/lib/marketing/i18n';
import { getPlansForModels } from '@/lib/marketing/pricing';
import type { CurrencyCode, MarketLocale, PlanDefinition, PlanKey } from '@/lib/marketing/schema';

type ModelsConversionShellProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
};

const heroHighlights: Record<MarketLocale, string[]> = {
  en: [
    'Each plan is explained in plain language.',
    'Status labels show what is active today.',
    'Checkout supports USD and EUR flows.',
  ],
  es: [
    'Cada plan se explica en lenguaje simple.',
    'Las etiquetas muestran lo activo hoy.',
    'Checkout disponible en USD y EUR.',
  ],
};

const jumpLinks: Record<MarketLocale, Array<{ href: string; label: string }>> = {
  en: [
    { href: '#plans', label: 'Compare plans' },
    { href: '#snapshot', label: 'Plan snapshot' },
    { href: '#steps', label: 'After purchase' },
  ],
  es: [
    { href: '#plans', label: 'Comparar planes' },
    { href: '#snapshot', label: 'Resumen' },
    { href: '#steps', label: 'Despues de compra' },
  ],
};

function getPriceLine(plan: PlanDefinition, locale: MarketLocale, currency: CurrencyCode): string {
  if (plan.amount === null) {
    return '--';
  }

  const amount = formatAmount(plan.amount, currency, locale);
  return locale === 'en' ? `${amount}/month` : `${amount}/mes`;
}

export function ModelsConversionShell({ locale, currency }: ModelsConversionShellProps) {
  useEffect(() => {
    document.cookie = `${MARKET_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${MARKET_CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;

    trackMarketingEvent('models_view', {
      locale,
      currency,
      source: 'models',
    });
  }, [locale, currency]);

  const plans = getPlansForModels(currency);

  const handlePlanClick = (plan: PlanDefinition, source: string) => {
    trackMarketingEvent('plan_card_click', {
      locale,
      currency,
      planKey: plan.key,
      source,
    });

    trackMarketingEvent('checkout_intent_created', {
      locale,
      currency,
      planKey: plan.key,
      source,
    });

    trackMarketingEvent('checkout_redirect_started', {
      locale,
      currency,
      planKey: plan.key,
      source,
    });
  };

  return (
    <div className='relative mx-auto w-full max-w-[1760px] px-4 pb-20 pt-8 sm:px-6 lg:px-8'>
      <article className='mx-auto max-w-[1120px] space-y-8 sm:space-y-10 lg:space-y-12'>
        <header className='glass-surface glass-standard glass-e3 space-y-6 rounded-[5.5px] p-5 sm:p-8 lg:p-10'>
          <div className='space-y-4'>
            <TypographyEyebrow>{modelsContent.eyebrow[locale]}</TypographyEyebrow>
            <TypographyH1>{modelsContent.title[locale]}</TypographyH1>
            <TypographyLead>{modelsContent.subtitle[locale]}</TypographyLead>
          </div>

          <ul className='grid gap-2 text-sm tracking-[-0.02em] text-[color:var(--subtitle)] sm:text-base md:grid-cols-3'>
            {heroHighlights[locale].map((point) => (
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
            >
              <Link href='#plans'>{locale === 'en' ? 'Compare Plans' : 'Comparar planes'}</Link>
            </Button>
            <Button
              asChild
              variant='ghost'
              className='min-h-11 w-full justify-center border border-[color:var(--muted)]/40 px-6 text-xs uppercase tracking-[0.12em] text-[color:var(--fg)] sm:w-auto sm:text-sm'
              onClick={() =>
                trackMarketingEvent('contact_sales_click', {
                  locale,
                  currency,
                  source: 'models_hero',
                })
              }
            >
              <Link href='/contact'>{modelsContent.enterpriseCta[locale]}</Link>
            </Button>
          </div>

          <nav
            aria-label={locale === 'en' ? 'Models sections' : 'Secciones de modelos'}
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

        <section id='plans' className='glass-surface glass-subtle glass-e2 space-y-6 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end'>
            <div className='space-y-3'>
              <TypographyEyebrow>{locale === 'en' ? 'Plan Comparison' : 'Comparacion de planes'}</TypographyEyebrow>
              <TypographyH2 className='border-none pb-0'>{modelsContent.comparisonTitle[locale]}</TypographyH2>
            </div>
            <TypographyMuted className='max-w-none'>{modelsContent.comparisonDescription[locale]}</TypographyMuted>
          </div>
          <div className='grid gap-5 xl:grid-cols-2'>
            {plans.map((plan) => {
              const href = buildCheckoutStartHref({
                planKey: plan.key,
                currency,
                locale,
                source: 'models_plan_card',
              });

              return (
                <section key={plan.key} className='glass-surface glass-standard glass-e2 flex h-full flex-col gap-3 rounded-[5.5px] p-5'>
                  <div className='flex flex-wrap items-center justify-between gap-3'>
                    <TypographyH3>{plan.title[locale]}</TypographyH3>
                    <TypographySmall className='rounded-full border border-[color:var(--muted)]/30 px-3 py-1 uppercase tracking-[0.12em] text-[color:var(--subtitle)]'>
                      {plan.status === 'active' ? (locale === 'en' ? 'Active' : 'Activo') : locale === 'en' ? 'Building' : 'En construccion'}
                    </TypographySmall>
                  </div>
                  <TypographyLarge>{getPriceLine(plan, locale, currency)}</TypographyLarge>
                  <TypographyP>{plan.summary[locale]}</TypographyP>
                  <TypographyList className='my-0 space-y-1.5 text-sm'>
                    {plan.benefits[locale].map((benefit) => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </TypographyList>
                  <Button
                    asChild
                    variant='brand'
                    className='mt-auto min-h-11 w-full justify-center px-6 text-xs uppercase tracking-[0.12em] sm:text-sm'
                    onClick={() => handlePlanClick(plan, 'models_plan_card')}
                  >
                    <Link href={href}>{plan.ctaLabel[locale]}</Link>
                  </Button>
                </section>
              );
            })}
          </div>
        </section>

        <section id='snapshot' className='glass-surface glass-subtle glass-e2 space-y-5 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <TypographyEyebrow>{locale === 'en' ? 'Snapshot' : 'Resumen'}</TypographyEyebrow>
          <TypographyH2 className='border-none pb-0'>{locale === 'en' ? 'Plan snapshot' : 'Resumen de planes'}</TypographyH2>
          <TypographyTable>
            <thead>
              <tr className='border-b border-[color:var(--muted)]/30 text-[color:var(--subtitle)]'>
                <th className='px-4 py-3 font-semibold'>{locale === 'en' ? 'Plan' : 'Plan'}</th>
                <th className='px-4 py-3 font-semibold'>{locale === 'en' ? 'Price' : 'Precio'}</th>
                <th className='px-4 py-3 font-semibold'>{locale === 'en' ? 'Best for' : 'Ideal para'}</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={`row-${plan.key}`} className='border-b border-[color:var(--muted)]/20'>
                  <td className='px-4 py-3 text-[color:var(--fg)]'>{plan.title[locale]}</td>
                  <td className='px-4 py-3 text-[color:var(--fg)]'>{getPriceLine(plan, locale, currency)}</td>
                  <td className='px-4 py-3 text-[color:var(--subtitle)]'>{plan.benefits[locale][0]}</td>
                </tr>
              ))}
            </tbody>
          </TypographyTable>
        </section>

        <section id='steps' className='glass-surface glass-subtle glass-e2 space-y-5 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end'>
            <div className='space-y-3'>
              <TypographyEyebrow>{locale === 'en' ? 'After Purchase' : 'Despues de compra'}</TypographyEyebrow>
              <TypographyH2 className='border-none pb-0'>{modelsContent.stepsTitle[locale]}</TypographyH2>
            </div>
            <TypographyMuted className='max-w-none'>{modelsContent.stepsDescription[locale]}</TypographyMuted>
          </div>
          <ol className='grid gap-4 md:grid-cols-3'>
            {purchaseSteps.map((step, index) => (
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

        <section className='glass-surface glass-standard glass-e3 space-y-4 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <TypographyEyebrow>{locale === 'en' ? 'Enterprise' : 'Enterprise'}</TypographyEyebrow>
          <TypographyH2 className='border-none pb-0'>{modelsContent.enterpriseTitle[locale]}</TypographyH2>
          <TypographyP>{modelsContent.enterpriseDescription[locale]}</TypographyP>
          <Button
            asChild
            variant='brand'
            className='min-h-11 w-full justify-center px-6 text-xs uppercase tracking-[0.12em] sm:w-auto sm:text-sm'
            onClick={() =>
              trackMarketingEvent('contact_sales_click', {
                locale,
                currency,
                source: 'models_enterprise_block',
              })
            }
          >
            <Link href='/contact'>{modelsContent.enterpriseCta[locale]}</Link>
          </Button>
        </section>
      </article>
    </div>
  );
}
