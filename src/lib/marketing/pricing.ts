import type { CurrencyCode, MarketLocale, PlanDefinition, PlanKey } from './schema';

const basePlans: Record<PlanKey, Omit<PlanDefinition, 'amount'>> = {
  pro_monthly: {
    key: 'pro_monthly',
    title: {
      en: 'Pro',
      es: 'Pro',
    },
    summary: {
      en: 'Full Tado access. Download and run locally.',
      es: 'Acceso completo a Tado. Descarga y ejecuta localmente.',
    },
    cadence: 'monthly',
    mode: 'subscription',
    benefits: {
      en: [
        'Full access to Tado',
        'All updates included',
        'Priority support',
      ],
      es: [
        'Acceso completo a Tado',
        'Todas las actualizaciones incluidas',
        'Soporte prioritario',
      ],
    },
    ctaLabel: {
      en: 'Start Pro',
      es: 'Comenzar Pro',
    },
    status: 'active',
  },
};

const priceMatrix: Record<PlanKey, Record<CurrencyCode, number>> = {
  pro_monthly: {
    USD: 9.99,
    EUR: 9.99,
    GBP: 9.99,
  },
};

export function getPlanDefinition(planKey: PlanKey, currency: CurrencyCode): PlanDefinition {
  return {
    ...basePlans[planKey],
    amount: priceMatrix[planKey][currency],
  };
}

export function getPlansForModels(currency: CurrencyCode): PlanDefinition[] {
  return [getPlanDefinition('pro_monthly', currency)];
}

export function parsePlanKey(value: string | null | undefined): PlanKey | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized === 'pro_monthly') {
    return normalized;
  }

  return undefined;
}

export function planDisplayLabel(locale: MarketLocale, planKey: PlanKey): string {
  return basePlans[planKey].title[locale];
}
