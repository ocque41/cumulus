import { describe, expect, it } from 'vitest';

import { buildCheckoutStartHref } from '@/lib/marketing/checkout';
import { loadMarketingHomeDocument } from '@/lib/marketing/home-doc';
import { currencyFromAcceptLanguage, resolveCurrency } from '@/lib/marketing/currency';
import { localeFromAcceptLanguage, resolveMarketLocale } from '@/lib/marketing/i18n';
import { getPlansForModels } from '@/lib/marketing/pricing';
import { getMarketingProductBriefs } from '@/lib/marketing/product-briefs';
import { resolveMarketRuntimeContext } from '@/lib/marketing/runtime';

describe('marketing runtime resolution', () => {
  it('resolves locale from accept-language', () => {
    expect(localeFromAcceptLanguage('es-ES,es;q=0.8,en;q=0.7')).toBe('es');
    expect(localeFromAcceptLanguage('en-US,en;q=0.9')).toBe('en');
  });

  it('resolves cookie locale before header locale', () => {
    expect(resolveMarketLocale({ cookieLocale: 'es', acceptLanguage: 'en-US' })).toBe('es');
  });

  it('resolves currency from region and cookie', () => {
    expect(currencyFromAcceptLanguage('es-ES,es;q=0.9')).toBe('EUR');
    expect(resolveCurrency({ cookieCurrency: 'usd', acceptLanguage: 'es-ES', locale: 'es' })).toBe('USD');
  });

  it('resolves full runtime context', () => {
    const context = resolveMarketRuntimeContext({
      acceptLanguage: 'es-ES,es;q=0.9',
      localeCookie: null,
      currencyCookie: null,
    });

    expect(context).toEqual({
      locale: 'es',
      currency: 'EUR',
    });
  });
});

describe('marketing pricing', () => {
  it('returns expected plan set for models', () => {
    const plans = getPlansForModels('USD');
    expect(plans.map((plan) => plan.key)).toEqual(['cumulus_db_free']);
    expect(plans.find((plan) => plan.key === 'cumulus_db_free')?.amount).toBe(0);
  });

  it('builds checkout start href with required query params', () => {
    const href = buildCheckoutStartHref({
      planKey: 'cumulus_db_free',
      currency: 'USD',
      locale: 'en',
      source: 'unit',
    });

    expect(href).toContain('/checkout/start?');
    expect(href).toContain('planKey=cumulus_db_free');
    expect(href).toContain('currency=USD');
  });
});

describe('marketing product briefs', () => {
  it('returns only the active Cumulus Create brief', () => {
    const briefs = getMarketingProductBriefs();
    expect(briefs.map((brief) => brief.product)).toEqual(['cumulus-db']);
    expect(briefs[0]?.title.en).toBe('Cumulus Create');
  });
});

describe('marketing home document', () => {
  it('loads the Cumulus Create hero and product document', async () => {
    const [enDocument, esDocument] = await Promise.all([
      loadMarketingHomeDocument('en'),
      loadMarketingHomeDocument('es'),
    ]);

    expect(enDocument.hero.title).toBe('Cumulus Create');
    expect(esDocument.hero.title).toBe('Cumulus Create');

    expect(enDocument.products.map((product) => product.id)).toEqual(['cumulus-db']);
    expect(esDocument.products.map((product) => product.id)).toEqual(['cumulus-db']);

    const databaseEn = enDocument.products.find((product) => product.id === 'cumulus-db');
    expect(databaseEn?.frontMatter.title).toBe('Cumulus Create');
    expect(databaseEn?.surfaces.map((surface) => surface.id)).toEqual(['templates', 'auth', 'db', 'flags']);
  });
});
