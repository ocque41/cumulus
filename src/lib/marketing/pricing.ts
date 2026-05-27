import type { CurrencyCode, MarketLocale, PlanDefinition, PlanKey } from './schema';

const basePlans: Record<PlanKey, Omit<PlanDefinition, 'amount'>> = {
  cumulus_db_free: {
    key: 'cumulus_db_free',
    title: {
      en: 'Cumulus Create',
      es: 'Cumulus Create',
    },
    summary: {
      en: 'Run npm create @cmls@latest my-acme.',
      es: 'Ejecuta npm create @cmls@latest my-acme.',
    },
    cadence: 'one-time',
    mode: 'contact',
    benefits: {
      en: [
        'Template choices',
        'Relay auth choices',
        'Cumulus DB choices',
      ],
      es: [
        'Opciones de template',
        'Opciones de auth Relay',
        'Opciones Cumulus DB',
      ],
    },
    ctaLabel: {
      en: 'Build command',
      es: 'Crear comando',
    },
    status: 'active',
  },
};

const priceMatrix: Record<PlanKey, Record<CurrencyCode, number>> = {
  cumulus_db_free: {
    USD: 0,
    EUR: 0,
    GBP: 0,
  },
};

export function getPlanDefinition(planKey: PlanKey, currency: CurrencyCode): PlanDefinition {
  return {
    ...basePlans[planKey],
    amount: priceMatrix[planKey][currency],
  };
}

export function getPlansForModels(currency: CurrencyCode): PlanDefinition[] {
  return [getPlanDefinition('cumulus_db_free', currency)];
}

export function parsePlanKey(value: string | null | undefined): PlanKey | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  if (normalized === 'cumulus_db_free') {
    return normalized;
  }

  return undefined;
}

export function planDisplayLabel(locale: MarketLocale, planKey: PlanKey): string {
  return basePlans[planKey].title[locale];
}
