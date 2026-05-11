import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MarketLocale } from '@/lib/marketing/schema';

type FeatureRow = {
  id: string;
  label: Record<MarketLocale, string>;
};

const features: FeatureRow[] = [
  {
    id: 'full-access',
    label: {
      en: 'Full access to Tado',
      es: 'Acceso completo a Tado',
    },
  },
  {
    id: 'updates',
    label: {
      en: 'All updates included',
      es: 'Todas las actualizaciones incluidas',
    },
  },
  {
    id: 'support',
    label: {
      en: 'Priority support',
      es: 'Soporte prioritario',
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
          {locale === 'en' ? 'Pro Plan' : 'Plan Pro'}
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
