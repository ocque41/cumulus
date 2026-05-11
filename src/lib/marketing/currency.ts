import type { CurrencyCode, MarketLocale } from './schema';

export const MARKET_CURRENCY_COOKIE = 'cml_currency';

const euroRegions = new Set([
  'AT',
  'BE',
  'CY',
  'DE',
  'EE',
  'ES',
  'FI',
  'FR',
  'GR',
  'HR',
  'IE',
  'IT',
  'LT',
  'LU',
  'LV',
  'MT',
  'NL',
  'PT',
  'SI',
  'SK',
]);

const gbpRegions = new Set(['GB']);

export function normalizeCurrency(value: string | null | undefined): CurrencyCode | undefined {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toUpperCase();
  if (normalized === 'USD' || normalized === 'EUR' || normalized === 'GBP') {
    return normalized;
  }

  return undefined;
}

export function currencyFromAcceptLanguage(acceptLanguage: string | null | undefined): CurrencyCode {
  if (!acceptLanguage) {
    return 'USD';
  }

  const tags = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim())
    .filter(Boolean) as string[];

  for (const tag of tags) {
    const match = tag.match(/^[a-z]{2}-([a-z]{2})$/i);
    if (match) {
      const region = match[1].toUpperCase();
      if (gbpRegions.has(region)) {
        return 'GBP';
      }
      if (euroRegions.has(region)) {
        return 'EUR';
      }
    }

    if (tag.toLowerCase().startsWith('en-gb')) {
      return 'GBP';
    }

    if (tag.toLowerCase().startsWith('es')) {
      return 'EUR';
    }
  }

  return 'USD';
}

export function resolveCurrency(input: {
  cookieCurrency?: string | null;
  acceptLanguage?: string | null;
  locale?: MarketLocale;
}): CurrencyCode {
  const fromCookie = normalizeCurrency(input.cookieCurrency);
  if (fromCookie) {
    return fromCookie;
  }

  const fromLanguage = currencyFromAcceptLanguage(input.acceptLanguage);
  if (fromLanguage === 'EUR') {
    return fromLanguage;
  }

  if (input.locale === 'es') {
    return 'EUR';
  }

  return 'USD';
}

export function currencySymbol(currency: CurrencyCode): string {
  if (currency === 'EUR') return 'EUR';
  if (currency === 'GBP') return 'GBP';
  return 'USD';
}

export function formatAmount(amount: number, currency: CurrencyCode, locale: MarketLocale): string {
  const localeCode = locale === 'es' ? 'es-ES' : 'en-US';

  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
