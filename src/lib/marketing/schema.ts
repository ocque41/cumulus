export type MarketLocale = 'en' | 'es';

export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export type PlanKey = 'pro_monthly';

export type CheckoutMode = 'payment' | 'subscription' | 'contact';

export type LocalizedText = Record<MarketLocale, string>;

export type PlanDefinition = {
  key: PlanKey;
  title: LocalizedText;
  summary: LocalizedText;
  cadence: 'one-time' | 'monthly' | 'annual' | 'contact';
  amount: number | null;
  mode: CheckoutMode;
  benefits: Record<MarketLocale, string[]>;
  ctaLabel: LocalizedText;
  status: 'active' | 'building';
};

export type MarketingProductBrief = {
  product: 'rune' | 'enterprise' | 'blocks' | 'hub' | 'notes';
  status: 'active' | 'building' | 'coming-soon';
  title: LocalizedText;
  oneLiner: LocalizedText;
  outcome: LocalizedText;
  whoFor: LocalizedText;
  capabilities: Record<MarketLocale, string[]>;
};

export type MarketingHomeContent = {
  heroEyebrow: LocalizedText;
  heroTitle: LocalizedText;
  heroSubtitle: LocalizedText;
  heroPrimaryCta: LocalizedText;
  heroSecondaryCta: LocalizedText;
  selectorTitle: LocalizedText;
  selectorDescription: LocalizedText;
  federationTitle: LocalizedText;
  federationDescription: LocalizedText;
  flowTitle: LocalizedText;
  flowDescription: LocalizedText;
  trustTitle: LocalizedText;
  trustDescription: LocalizedText;
  pricingBridgeTitle: LocalizedText;
  pricingBridgeDescription: LocalizedText;
  pricingBridgeCta: LocalizedText;
};

export type MarketingModelsContent = {
  eyebrow: LocalizedText;
  title: LocalizedText;
  subtitle: LocalizedText;
  comparisonTitle: LocalizedText;
  comparisonDescription: LocalizedText;
  stepsTitle: LocalizedText;
  stepsDescription: LocalizedText;
  enterpriseTitle: LocalizedText;
  enterpriseDescription: LocalizedText;
  enterpriseCta: LocalizedText;
};

export type SelectorPersona = {
  id: 'operator' | 'client-services' | 'field-admin' | 'founder';
  label: LocalizedText;
  description: LocalizedText;
  recommendedProducts: Array<'rune' | 'enterprise' | 'blocks' | 'hub' | 'notes'>;
};

export type DailyFlowStep = {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
};

export type PurchaseStep = {
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
};

export const marketingLocales: MarketLocale[] = ['en', 'es'];
export const supportedCurrencies: CurrencyCode[] = ['USD', 'EUR', 'GBP'];
