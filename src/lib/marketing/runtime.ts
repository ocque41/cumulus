import type { CurrencyCode, MarketLocale } from './schema';
import { MARKET_CURRENCY_COOKIE, resolveCurrency } from './currency';
import { MARKET_LOCALE_COOKIE, resolveMarketLocale } from './i18n';

export type MarketRuntimeContext = {
  locale: MarketLocale;
  currency: CurrencyCode;
};

export function resolveMarketRuntimeContext(input: {
  acceptLanguage?: string | null;
  localeCookie?: string | null;
  currencyCookie?: string | null;
}): MarketRuntimeContext {
  const locale = resolveMarketLocale({
    cookieLocale: input.localeCookie,
    acceptLanguage: input.acceptLanguage,
  });

  const currency = resolveCurrency({
    cookieCurrency: input.currencyCookie,
    acceptLanguage: input.acceptLanguage,
    locale,
  });

  return { locale, currency };
}

export { MARKET_LOCALE_COOKIE, MARKET_CURRENCY_COOKIE };
