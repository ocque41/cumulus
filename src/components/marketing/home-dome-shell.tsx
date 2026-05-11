'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

import { animate, createTimeline, stagger } from 'animejs';

import { MarketingMarkdown } from '@/components/marketing/marketing-markdown';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  TypographyEyebrow,
  TypographyH1,
  TypographyH2,
  TypographyLead,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from '@/components/ui/typography';
import { useReducedMotion } from '@/hooks';
import { MARKET_CURRENCY_COOKIE } from '@/lib/marketing/currency';
import { domeHomeContent } from '@/lib/marketing/dome-home-content';
import { trackMarketingEvent } from '@/lib/marketing/events';
import { MARKET_LOCALE_COOKIE } from '@/lib/marketing/i18n';
import type { CurrencyCode, MarketLocale } from '@/lib/marketing/schema';

type HomeDomeShellProps = {
  locale: MarketLocale;
  currency: CurrencyCode;
};

export function HomeDomeShell({ locale, currency }: HomeDomeShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const content = domeHomeContent[locale];

  useEffect(() => {
    document.cookie = `${MARKET_LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${MARKET_CURRENCY_COOKIE}=${currency}; path=/; max-age=31536000; samesite=lax`;

    trackMarketingEvent('home_view', {
      locale,
      currency,
      source: 'home_dome',
    });
  }, [locale, currency]);

  useEffect(() => {
    if (prefersReducedMotion || !rootRef.current) {
      return;
    }

    const root = rootRef.current;
    const systemScan = root.querySelector('[data-system-scan]');
    const timeline = createTimeline({
      defaults: {
        duration: 700,
        ease: 'outExpo',
      },
    })
      .add(root.querySelectorAll('[data-hero-copy]'), {
        opacity: [0, 1],
        translateY: [28, 0],
        delay: stagger(80),
      })
      .add(
        root.querySelectorAll('[data-hero-chip]'),
        {
          opacity: [0, 1],
          translateY: [16, 0],
          delay: stagger(70),
        },
        '-=320'
      );

    if (systemScan) {
      timeline.add(
        systemScan,
        {
          opacity: [0, 1],
          translateY: [22, 0],
        },
        '-=360'
      );
    }

    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal-section]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          animate(entry.target, {
            opacity: [0, 1],
            translateY: [22, 0],
            duration: 720,
            easing: 'outExpo',
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -12% 0px' }
    );

    panels.forEach((panel) => {
      panel.style.opacity = '0';
      observer.observe(panel);
    });

    return () => {
      timeline.cancel();
      observer.disconnect();
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={rootRef} className='relative z-10 mx-auto w-full max-w-[1760px] px-4 pb-24 pt-6 sm:px-6 lg:px-10'>
      <article className='mx-auto max-w-[1380px] space-y-10 sm:space-y-14'>
        <section className='dome-hero min-h-[calc(100vh-10rem)]'>
          <div className='glass-surface glass-standard glass-e4 relative overflow-hidden rounded-[5.5px] border border-[color:var(--glass-border-base)]/80 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.03),transparent_34%)]' />
            <div className='relative grid gap-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(300px,360px)] xl:gap-10'>
              <div className='space-y-6'>
                <div data-hero-copy className='space-y-4 opacity-0'>
                  <TypographyEyebrow>{content.heroEyebrow}</TypographyEyebrow>
                  <TypographyH1 className='max-w-[15ch]'>{content.heroTitle}</TypographyH1>
                  <TypographyLead className='max-w-[64ch]'>{content.heroSubtitle}</TypographyLead>
                </div>

                <div className='flex flex-wrap gap-2'>
                  {content.heroChips.map((chip) => (
                    <Badge
                      key={chip}
                      data-hero-chip
                      variant='outline'
                      className='glass-surface glass-subtle glass-e1 border-[color:var(--glass-border-base)]/70 bg-black/10 px-3 py-1.5 text-[0.68rem] tracking-[0.16em] text-[color:var(--subtitle)] opacity-0'
                    >
                      {chip}
                    </Badge>
                  ))}
                </div>

                <div data-hero-copy className='flex flex-col gap-3 opacity-0 sm:flex-row sm:items-center'>
                  <Button
                    asChild
                    variant='brand'
                    className='min-h-11 w-full justify-center px-6 text-xs uppercase tracking-[0.12em] sm:w-auto sm:text-sm'
                    onClick={() =>
                      trackMarketingEvent('home_primary_cta_click', {
                        locale,
                        currency,
                        source: 'home_dome_hero',
                      })
                    }
                  >
                    <Link href='/contact'>{content.heroPrimaryCta}</Link>
                  </Button>

                  <Button
                    asChild
                    variant='ghost'
                    className='min-h-11 w-full justify-center border border-[color:var(--muted)]/35 px-6 text-xs uppercase tracking-[0.12em] text-[color:var(--fg)] sm:w-auto sm:text-sm'
                  >
                    <Link href={content.heroSecondaryHref}>{content.heroSecondaryCta}</Link>
                  </Button>
                </div>

                <div data-hero-copy className='space-y-4 opacity-0'>
                  <Separator className='bg-[color:var(--glass-border-base)]/70' />
                  <nav
                    aria-label={locale === 'en' ? 'Homepage sections' : 'Secciones de portada'}
                    className='flex flex-wrap gap-2'
                  >
                    {content.jumpLinks.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className='rounded-full border border-[color:var(--glass-border-base)]/70 bg-black/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--subtitle)] transition-colors hover:text-[color:var(--fg)]'
                      >
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </div>

              <aside
                data-system-scan
                className='glass-surface glass-subtle glass-e2 relative overflow-hidden rounded-[5.5px] border border-[color:var(--glass-border-base)]/80 bg-black/10 p-4 opacity-0 sm:p-5'
              >
                <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_42%)]' />
                <div className='relative space-y-4'>
                  <div className='space-y-2'>
                    <TypographySmall className='uppercase tracking-[0.18em] text-[color:var(--subtitle)]'>
                      {locale === 'en' ? 'System scan' : 'Escaneo del sistema'}
                    </TypographySmall>
                    <TypographyP className='max-w-none text-sm sm:text-[0.98rem]'>
                      {locale === 'en'
                        ? 'Tado gives you the canvas and the communication layer for running multiple AI agents in parallel.'
                        : 'Tado te da el canvas y la capa de comunicacion para ejecutar multiples agentes IA en paralelo.'}
                    </TypographyP>
                  </div>

                  <div className='space-y-3'>
                    {content.heroStats.map((stat) => (
                      <div
                        key={stat.label}
                        className='rounded-[5.5px] border border-[color:var(--glass-border-base)]/70 bg-white/[0.03] px-3 py-3'
                      >
                        <div className='flex items-baseline justify-between gap-3'>
                          <span className='text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--subtitle)]'>
                            {stat.label}
                          </span>
                          <span className='text-sm font-semibold tracking-[-0.05em] text-[color:var(--title)]'>
                            {stat.value}
                          </span>
                        </div>
                        <p className='mt-2 text-sm leading-[1.55] tracking-[-0.03em] text-[color:var(--text)]'>{stat.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section id='brief' className='grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]'>
          <div data-reveal-section className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
            <MarketingMarkdown content={content.editorialMarkdown} />
          </div>
          <div className='grid gap-6'>
            <div data-reveal-section className='glass-surface glass-subtle glass-e2 rounded-[5.5px] p-5 sm:p-7'>
              <MarketingMarkdown content={content.localMarkdown} />
            </div>
            <div data-reveal-section className='glass-surface glass-subtle glass-e2 rounded-[5.5px] p-5 sm:p-7'>
              <TypographyEyebrow>{locale === 'en' ? 'Product fit' : 'Ajuste del producto'}</TypographyEyebrow>
              <TypographyH2 className='mt-4 border-none pb-0 text-[1.8rem] sm:text-[2rem]'>
                {locale === 'en'
                  ? 'A better workflow than running agents in separate terminal tabs.'
                  : 'Un mejor flujo que ejecutar agentes en pestanas de terminal separadas.'}
              </TypographyH2>
              <TypographyMuted className='mt-4 max-w-none'>
                {locale === 'en'
                  ? 'The hard part is not spawning agents. The hard part is getting them to coordinate without writing orchestration code.'
                  : 'La parte dificil no es crear agentes. La parte dificil es lograr que se coordinen sin escribir codigo de orquestacion.'}
              </TypographyMuted>
            </div>
          </div>
        </section>

        <section id='system' data-reveal-section className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
          <MarketingMarkdown content={content.architectureMarkdown} />
        </section>

        <section id='surfaces' className='space-y-5'>
          <div data-reveal-section className='glass-surface glass-subtle glass-e2 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
            <TypographyEyebrow>{locale === 'en' ? 'Surface map' : 'Mapa de superficies'}</TypographyEyebrow>
            <TypographyH2 className='mt-4 border-none pb-0'>{content.surfacesTitle}</TypographyH2>
            <TypographyMuted className='mt-3 max-w-[74ch]'>{content.surfacesDescription}</TypographyMuted>
          </div>

          <div className='grid gap-5 xl:grid-cols-2'>
            {content.surfaces.map((surface) => (
              <Card
                key={surface.title}
                data-reveal-section
                className='border border-[color:var(--glass-border-base)]/80 bg-black/10'
                material='standard'
                elevation='e2'
              >
                <CardHeader className='space-y-3'>
                  <TypographySmall className='uppercase tracking-[0.18em] text-[color:var(--subtitle)]'>
                    {locale === 'en' ? 'Surface' : 'Superficie'}
                  </TypographySmall>
                  <CardTitle className='text-[1.45rem] leading-[1.05] tracking-[-0.06em] text-[color:var(--title)]'>
                    {surface.title}
                  </CardTitle>
                  <TypographyMuted className='max-w-none'>{surface.summary}</TypographyMuted>
                </CardHeader>
                <CardContent>
                  <MarketingMarkdown content={surface.markdown} className='[&_ul]:my-0' />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id='workflow' className='space-y-5'>
          <div data-reveal-section className='glass-surface glass-subtle glass-e2 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
            <TypographyEyebrow>{locale === 'en' ? 'Operator loop' : 'Bucle del operador'}</TypographyEyebrow>
            <TypographyH2 className='mt-4 border-none pb-0'>{content.workflowTitle}</TypographyH2>
            <TypographyMuted className='mt-3 max-w-[72ch]'>{content.workflowDescription}</TypographyMuted>
          </div>

          <ol className='grid gap-4 lg:grid-cols-2 xl:grid-cols-4'>
            {content.workflowSteps.map((step) => (
              <li key={step.id}>
                <Card
                  data-reveal-section
                  className='h-full border border-[color:var(--glass-border-base)]/80 bg-black/10'
                  material='subtle'
                  elevation='e1'
                >
                  <CardHeader className='gap-3'>
                    <TypographySmall className='uppercase tracking-[0.18em] text-[color:var(--subtitle)]'>
                      {step.label}
                    </TypographySmall>
                    <CardTitle className='text-[1.2rem] leading-[1.08] tracking-[-0.05em] text-[color:var(--title)]'>
                      {step.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TypographyP className='text-[0.98rem] leading-[1.62]'>{step.detail}</TypographyP>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </section>

        <section className='grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]'>
          <div data-reveal-section className='glass-surface glass-standard glass-e3 rounded-[5.5px] p-5 sm:p-7 lg:p-8'>
            <MarketingMarkdown content={content.trustMarkdown} />
          </div>
          <div
            data-reveal-section
            className='glass-surface glass-standard glass-e4 relative overflow-hidden rounded-[5.5px] border border-[color:var(--glass-border-base)]/80 px-5 py-6 sm:px-7 sm:py-7 lg:px-8 lg:py-8'
          >
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%)]' />
            <div className='relative space-y-5'>
              <TypographyEyebrow>{content.finalEyebrow}</TypographyEyebrow>
              <TypographyH2 className='border-none pb-0'>{content.finalTitle}</TypographyH2>
              <TypographyP className='max-w-[66ch]'>{content.finalBody}</TypographyP>
              <div className='flex flex-col gap-3 sm:flex-row sm:items-center'>
                <Button
                  asChild
                  variant='brand'
                  className='min-h-11 w-full justify-center px-6 text-xs uppercase tracking-[0.12em] sm:w-auto sm:text-sm'
                    onClick={() =>
                    trackMarketingEvent('contact_sales_click', {
                      locale,
                      currency,
                      source: 'home_dome_final',
                    })
                  }
                >
                  <Link href='/contact'>{content.finalCta}</Link>
                </Button>
                <Button
                  asChild
                  variant='ghost'
                  className='min-h-11 w-full justify-center border border-[color:var(--muted)]/35 px-6 text-xs uppercase tracking-[0.12em] text-[color:var(--fg)] sm:w-auto sm:text-sm'
                >
                  <Link href='#brief'>{locale === 'en' ? 'Back to brief' : 'Volver al brief'}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
