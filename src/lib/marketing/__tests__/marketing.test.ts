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
    expect(plans.map((plan) => plan.key)).toEqual(['pro_monthly']);
    expect(plans.find((plan) => plan.key === 'pro_monthly')?.amount).toBe(9.99);
  });

  it('builds checkout start href with required query params', () => {
    const href = buildCheckoutStartHref({
      planKey: 'pro_monthly',
      currency: 'USD',
      locale: 'en',
      source: 'unit',
    });

    expect(href).toContain('/checkout/start?');
    expect(href).toContain('planKey=pro_monthly');
    expect(href).toContain('currency=USD');
  });
});

describe('marketing product briefs', () => {
  it('returns all scoped federation products', () => {
    const briefs = getMarketingProductBriefs();
    expect(briefs.map((brief) => brief.product)).toEqual(['rune', 'enterprise', 'blocks', 'hub', 'notes']);
  });
});

describe('marketing home document', () => {
  it('loads the company hero plus every registered product in order', async () => {
    const [enDocument, esDocument] = await Promise.all([
      loadMarketingHomeDocument('en'),
      loadMarketingHomeDocument('es'),
    ]);

    expect(enDocument.hero.title).toBe('Cumulus');
    expect(esDocument.hero.title).toBe('Cumulus');

    expect(enDocument.products.map((product) => product.id)).toEqual(['tado', 'relay']);
    expect(esDocument.products.map((product) => product.id)).toEqual(['tado', 'relay']);

    const tadoEn = enDocument.products.find((product) => product.id === 'tado');
    expect(tadoEn?.surfaces.map((surface) => surface.id)).toEqual(['canvas', 'ipc', 'teams', 'projects']);
  });
});
