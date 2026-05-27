import type { MarketingProductBrief } from './schema';

const productOrder: MarketingProductBrief['product'][] = ['cumulus-db'];

const productStatus: Record<MarketingProductBrief['product'], MarketingProductBrief['status']> = {
  'cumulus-db': 'active',
};

const copy: Record<MarketingProductBrief['product'], Omit<MarketingProductBrief, 'product' | 'status'>> = {
  'cumulus-db': {
    title: {
      en: 'Cumulus Create',
      es: 'Cumulus Create',
    },
    oneLiner: {
      en: 'npm create @cmls@latest my-acme',
      es: 'npm create @cmls@latest my-acme',
    },
    outcome: {
      en: 'Use it when you want a ready Cumulus app with clear flags.',
      es: 'Usalo cuando quieres una app Cumulus lista con flags claros.',
    },
    whoFor: {
      en: 'Developers starting a Cumulus app.',
      es: 'Developers que empiezan una app Cumulus.',
    },
    capabilities: {
      en: ['Templates', 'Relay auth', 'Cumulus DB modes', 'Knowledge runtimes'],
      es: ['Templates', 'Auth de Relay', 'Modos Cumulus DB', 'Runtimes de Knowledge'],
    },
  },
};

export function getMarketingProductBriefs(): MarketingProductBrief[] {
  return productOrder.map((product) => {
    const brief = copy[product];

    return {
      product,
      status: productStatus[product],
      ...brief,
    };
  });
}
