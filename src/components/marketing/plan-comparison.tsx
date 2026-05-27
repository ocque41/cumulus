import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MarketLocale } from '@/lib/marketing/schema';

type FeatureRow = {
  id: string;
  label: Record<MarketLocale, string>;
};

const features: FeatureRow[] = [
  {
    id: 'templates',
    label: {
      en: 'Template choices',
      es: 'Opciones de template',
    },
  },
  {
    id: 'relay',
    label: {
      en: 'Relay auth choices',
      es: 'Opciones de auth Relay',
    },
  },
  {
    id: 'db',
    label: {
      en: 'Cumulus DB choices',
      es: 'Opciones Cumulus DB',
    },
  },
];

type PlanComparisonProps = {
  locale: MarketLocale;
};

export function PlanComparison({ locale }: PlanComparisonProps) {
  return (
    <Card className='border border-[color:var(--muted)]/30 bg-[color:var(--bg)]/75'>
      <CardHeader>
        <CardTitle className='text-xl text-[color:var(--fg)]'>
          {locale === 'en' ? 'Cumulus Create' : 'Cumulus Create'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className='space-y-3 text-sm'>
          {features.map((feature) => (
            <li key={feature.id} className='flex items-start gap-2 text-[color:var(--fg)]'>
              <span aria-hidden className='mt-1.5 inline-flex h-1.5 w-1.5 rounded-full bg-[color:var(--fg)]/80' />
              <span>{feature.label[locale]}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
