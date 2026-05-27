import type { ReactNode } from 'react';
import Link from 'next/link';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Matrix, dna, forcefield, radar, signal } from '@/components/ui/matrix';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { ProductDocument, ProductSurface } from '@/lib/marketing/products/types';
import type { MarketLocale } from '@/lib/marketing/schema';

const matrixFrames = {
  forcefield,
  signal,
  radar,
  dna,
} as const;

const proseClassName = cn(
  'space-y-4 text-[color:var(--text)]',
  '[&_a]:text-[color:#d7d7d7] hover:[&_a]:text-white',
  '[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:leading-[1.02] [&_h2]:tracking-[-0.08em] [&_h2]:text-[color:var(--title)] sm:[&_h2]:text-[2.2rem]',
  '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-[-0.06em] [&_h3]:text-[color:var(--title)]',
  '[&_p]:max-w-[72ch] [&_p]:text-[1rem] [&_p]:leading-[1.75] [&_p]:tracking-[-0.03em] [&_p]:text-[color:var(--text)] sm:[&_p]:text-[1.05rem]',
  '[&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-2',
  '[&_ol]:ml-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-2',
  '[&_li]:leading-[1.7] [&_li]:tracking-[-0.02em]',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-[5.5px] [&_pre]:border [&_pre]:border-white/10 [&_pre]:bg-black/45 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-[color:#d7d7d7]',
  '[&_code]:rounded-md [&_code]:bg-white/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.95em] [&_code]:text-[color:#f5f5f5]',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_blockquote]:border-l [&_blockquote]:border-white/20 [&_blockquote]:pl-4 [&_blockquote]:text-[color:var(--subtitle)]'
);

function HomeMarkdown({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(proseClassName, className)}>{children}</div>;
}

function SurfacePreview({ surface }: { surface: ProductSurface }) {
  const frames = matrixFrames[surface.matrixPreset];

  return (
    <div className='grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start'>
      <div className='glass-surface glass-subtle glass-e1 flex flex-col items-center gap-4 rounded-[5.5px] p-5'>
        <div className='space-y-2 text-center'>
          <p className='text-[0.68rem] uppercase tracking-[0.22em] text-[color:var(--subtitle)]'>{surface.eyebrow}</p>
          <p className='text-sm font-semibold uppercase tracking-[0.16em] text-[color:#d7d7d7]'>{surface.status}</p>
        </div>
        <div className='glass-surface glass-standard glass-e2 rounded-[5.5px] p-4'>
          <Matrix
            rows={15}
            cols={15}
            frames={frames}
            fps={11}
            size={8}
            gap={3}
            autoplay={false}
            palette={{
              on: '#ffffff',
              off: 'rgba(167,167,167,0.12)',
            }}
            ariaLabel={`${surface.label} preview`}
          />
        </div>
      </div>
      <div className='glass-surface glass-standard glass-e2 rounded-[5.5px] p-5 sm:p-6'>
        <HomeMarkdown>{surface.content}</HomeMarkdown>
      </div>
    </div>
  );
}

type ProductSurfacesProps = {
  product: ProductDocument;
  locale: MarketLocale;
};

export function ProductSurfaces({ product, locale }: ProductSurfacesProps) {
  const { meta, frontMatter, surfaces, sections } = product;
  const defaultSurface = surfaces[0]?.id ?? meta.id;

  const isInDevelopment = meta.status === 'in_development';
  const isBeta = meta.status === 'beta';

  return (
    <div id={meta.id} className='space-y-10 pt-12 sm:pt-16'>
      <section className='scroll-mt-28 space-y-6 rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px] sm:p-8'>
        <div className='grid gap-4 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:items-end'>
          <div className='space-y-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--subtitle)]'>
                {frontMatter.surfacesEyebrow}
              </p>
              <span
                className={cn(
                  'rounded-full border px-2 py-[2px] font-mono text-[0.6rem] uppercase tracking-[0.18em]',
                  isInDevelopment
                    ? 'border-amber-400/30 bg-amber-400/10 text-amber-100/90'
                    : isBeta
                    ? 'border-white/20 bg-white/[0.04] text-white/80'
                    : 'border-white/10 bg-transparent text-[color:var(--muted)]'
                )}
              >
                {meta.statusLabel[locale]}
              </span>
            </div>
            <h2 className='text-[2.2rem] font-semibold leading-[0.98] tracking-[-0.09em] text-white sm:text-[3rem]'>
              {frontMatter.surfacesTitle}
            </h2>
          </div>
          <p className='max-w-[58ch] text-[1rem] leading-[1.75] tracking-[-0.03em] text-[color:#a7a7a7]'>
            {frontMatter.surfacesIntro}
          </p>
        </div>

        <div className='flex flex-wrap items-center gap-3 pt-1'>
          <Button
            asChild
            variant='brand'
            className='min-h-11 justify-center px-5 text-xs uppercase tracking-[0.16em]'
          >
            <Link href={meta.primaryHref}>{meta.primaryLabel[locale]}</Link>
          </Button>
          {meta.secondaryHref && meta.secondaryLabel ? (
            <Button
              asChild
              variant='ghost'
              className='min-h-11 justify-center rounded-full border border-white/12 px-5 text-xs uppercase tracking-[0.16em] text-[color:#d7d7d7] hover:border-white/25 hover:text-white'
            >
              <Link href={meta.secondaryHref}>{meta.secondaryLabel[locale]}</Link>
            </Button>
          ) : null}
        </div>

        <div className='hidden md:block'>
          <Tabs defaultValue={defaultSurface} className='gap-5'>
            <TabsList
              variant='glass'
              className='flex h-auto w-full flex-wrap justify-start gap-2 rounded-[5.5px] bg-transparent p-0'
            >
              {surfaces.map((surface) => (
                <TabsTrigger
                  key={surface.id}
                  value={surface.id}
                  variant='glass'
                  className='h-auto rounded-full border border-white/10 bg-transparent px-4 py-2 text-xs uppercase tracking-[0.16em] data-[state=active]:border-white/20'
                >
                  {surface.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {surfaces.map((surface) => (
              <TabsContent key={surface.id} value={surface.id}>
                <SurfacePreview surface={surface} />
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className='md:hidden'>
          <Accordion type='single' collapsible defaultValue={defaultSurface} className='space-y-3'>
            {surfaces.map((surface) => (
              <AccordionItem
                key={surface.id}
                value={surface.id}
                className='glass-surface glass-subtle glass-e1 rounded-[5.5px] border-white/10 px-4'
              >
                <AccordionTrigger className='text-left text-sm uppercase tracking-[0.14em] text-[color:#d7d7d7] hover:no-underline'>
                  {surface.label}
                </AccordionTrigger>
                <AccordionContent>
                  <SurfacePreview surface={surface} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {sections.length > 0 ? (
        <div className='space-y-6 sm:space-y-8'>
          {sections.map((section) => (
            <section
              key={section.id}
              id={`${meta.id}-${section.id}`}
              className='scroll-mt-28 grid gap-5 rounded-[5.5px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-[18px] sm:p-8 lg:grid-cols-[240px_minmax(0,1fr)]'
            >
              <div className='space-y-4'>
                <p className='text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--subtitle)]'>
                  {section.label}
                </p>
                <Separator className='bg-white/10' />
              </div>
              <div>
                <HomeMarkdown>{section.content}</HomeMarkdown>
              </div>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
