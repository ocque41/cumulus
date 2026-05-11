import { marketingLocales, type LocalizedText, type MarketLocale } from './schema';

export const MARKET_LOCALE_COOKIE = 'cml_locale';

const localeSet = new Set<MarketLocale>(marketingLocales);

export function normalizeMarketLocale(locale: string | null | undefined): MarketLocale | undefined {
  if (!locale) {
    return undefined;
  }

  const trimmed = locale.trim().toLowerCase();

  if (localeSet.has(trimmed as MarketLocale)) {
    return trimmed as MarketLocale;
  }

  if (trimmed.startsWith('es')) {
    return 'es';
  }

  if (trimmed.startsWith('en')) {
    return 'en';
  }

  return undefined;
}

export function localeFromAcceptLanguage(acceptLanguage: string | null | undefined): MarketLocale {
  if (!acceptLanguage) {
    return 'en';
  }

  const candidates = acceptLanguage
    .split(',')
    .map((part) => part.split(';')[0]?.trim())
    .filter(Boolean) as string[];

  for (const candidate of candidates) {
    const normalized = normalizeMarketLocale(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return 'en';
}

export function resolveMarketLocale(input: {
  cookieLocale?: string | null;
  acceptLanguage?: string | null;
}): MarketLocale {
  const cookieLocale = normalizeMarketLocale(input.cookieLocale ?? undefined);
  if (cookieLocale) {
    return cookieLocale;
  }

  return localeFromAcceptLanguage(input.acceptLanguage);
}

export function t(locale: MarketLocale, text: LocalizedText): string {
  return text[locale];
}
