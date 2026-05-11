import fs from 'node:fs/promises';
import path from 'node:path';

import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import type { Plugin } from 'unified';
import { z } from 'zod';

import type { MarketLocale } from './schema';
import { PRODUCT_ORDER } from './products';
import { loadProductDocument } from './products/product-doc';
import type {
  CompanyFinalCta,
  CompanyHeroContent,
  CompanyHomeDocument,
  ProductDocument,
  ProductSection,
  ProductSurface,
} from './products/types';

const marketingDirectory = path.join(process.cwd(), 'src', 'content', 'marketing');

const heroSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  heroEyebrow: z.string().min(1),
  heroTitle: z.string().min(1),
  heroSubtitle: z.string().min(1),
  heroBody: z.string().min(1),
  heroScanPoints: z.array(z.string().min(1)).min(3),
  heroPrimaryLabel: z.string().min(1),
  heroPrimaryHref: z.string().min(1),
  heroSecondaryLabel: z.string().min(1),
  heroSecondaryHref: z.string().min(1),
  sideLines: z.array(z.string().min(1)).min(1).max(5).optional(),
  finalCtaEyebrow: z.string().min(1),
  finalCtaTitle: z.string().min(1),
  finalCtaBody: z.string().min(1),
  finalCtaLabel: z.string().min(1),
  finalCtaHref: z.string().min(1),
});

type HomeFrontMatter = z.infer<typeof heroSchema>;

export type MarketingHomeDocument = CompanyHomeDocument & {
  title: string;
  description: string;
};

export type { ProductDocument, ProductSection, ProductSurface };

function getHomeFilePath(locale: MarketLocale) {
  return path.join(marketingDirectory, `home.${locale}.mdx`);
}

async function loadHomeFrontMatter(locale: MarketLocale): Promise<HomeFrontMatter> {
  const source = await fs.readFile(getHomeFilePath(locale), 'utf8');
  const { frontmatter } = await compileMDX<HomeFrontMatter>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm as unknown as Plugin],
      },
    },
  });
  return heroSchema.parse(frontmatter);
}

export async function loadMarketingHomeDocument(locale: MarketLocale): Promise<MarketingHomeDocument> {
  const [frontMatter, ...products] = await Promise.all([
    loadHomeFrontMatter(locale),
    ...PRODUCT_ORDER.map((id) => loadProductDocument(id, locale)),
  ]);

  const hero: CompanyHeroContent = {
    eyebrow: frontMatter.heroEyebrow,
    title: frontMatter.heroTitle,
    subtitle: frontMatter.heroSubtitle,
    body: frontMatter.heroBody,
    scanPoints: frontMatter.heroScanPoints,
    primaryLabel: frontMatter.heroPrimaryLabel,
    primaryHref: frontMatter.heroPrimaryHref,
    secondaryLabel: frontMatter.heroSecondaryLabel,
    secondaryHref: frontMatter.heroSecondaryHref,
    sideLines: frontMatter.sideLines ?? [],
  };

  const finalCta: CompanyFinalCta = {
    eyebrow: frontMatter.finalCtaEyebrow,
    title: frontMatter.finalCtaTitle,
    body: frontMatter.finalCtaBody,
    label: frontMatter.finalCtaLabel,
    href: frontMatter.finalCtaHref,
  };

  return {
    title: frontMatter.title,
    description: frontMatter.description,
    hero,
    products,
    finalCta,
  };
}
