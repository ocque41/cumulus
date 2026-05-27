import type { ReactNode } from 'react';

import type { LocalizedText } from '../schema';

export type ProductId = 'cumulus-db';

export type ProductStatus = 'ga' | 'beta' | 'in_development';

export type ProductMeta = {
  id: ProductId;
  name: string;
  status: ProductStatus;
  statusLabel: LocalizedText;
  primaryHref: string;
  primaryLabel: LocalizedText;
  secondaryHref?: string;
  secondaryLabel?: LocalizedText;
};

export type ProductSurface = {
  id: string;
  label: string;
  eyebrow: string;
  status: string;
  matrixPreset: 'forcefield' | 'signal' | 'radar' | 'dna';
  content: ReactNode;
};

export type ProductSection = {
  id: string;
  label: string;
  content: ReactNode;
};

export type ProductFrontMatter = {
  title: string;
  description: string;
  surfacesEyebrow: string;
  surfacesTitle: string;
  surfacesIntro: string;
};

export type ProductDocument = {
  id: ProductId;
  meta: ProductMeta;
  frontMatter: ProductFrontMatter;
  surfaces: ProductSurface[];
  sections: ProductSection[];
};

export type CompanyHeroContent = {
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string;
  scanPoints: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  sideLines: string[];
};

export type CompanyFinalCta = {
  eyebrow: string;
  title: string;
  body: string;
  label: string;
  href: string;
};

export type CompanyHomeDocument = {
  hero: CompanyHeroContent;
  finalCta: CompanyFinalCta;
  products: ProductDocument[];
};
