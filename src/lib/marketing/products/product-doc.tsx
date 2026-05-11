import fs from 'node:fs/promises';
import path from 'node:path';

import type { ReactNode } from 'react';

import { compileMDX } from 'next-mdx-remote/rsc';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import remarkGfm from 'remark-gfm';
import remarkSlug from 'remark-slug';
import type { Plugin } from 'unified';
import { z } from 'zod';

import type { MarketLocale } from '../schema';

import { PRODUCT_META } from './index';
import type { ProductDocument, ProductFrontMatter, ProductId, ProductSection, ProductSurface } from './types';

const marketingDirectory = path.join(process.cwd(), 'src', 'content', 'marketing', 'products');

const matrixPresetSchema = z.enum(['forcefield', 'signal', 'radar', 'dna']);

const surfaceSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  eyebrow: z.string().min(1),
  status: z.string().min(1),
  matrixPreset: matrixPresetSchema,
});

const sectionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
});

const frontMatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  surfacesEyebrow: z.string().min(1),
  surfacesTitle: z.string().min(1),
  surfacesIntro: z.string().min(1),
  surfaceTabs: z.array(surfaceSchema).min(3).max(4),
  sections: z.array(sectionSchema).min(1).max(6),
});

type ProductFrontMatterRaw = z.infer<typeof frontMatterSchema>;

function stripFrontMatter(source: string) {
  if (!source.startsWith('---\n')) {
    return source;
  }
  const closingIndex = source.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    return source;
  }
  return source.slice(closingIndex + 5);
}

function extractContentBlocks(source: string) {
  const blocks = new Map<string, string>();
  const marker = /<!--\s*content:([a-z0-9-]+)\s*-->/g;
  let currentId: string | null = null;
  let currentStart = 0;

  for (const match of source.matchAll(marker)) {
    if (currentId) {
      const previousBlock = source.slice(currentStart, match.index).trim();
      blocks.set(currentId, previousBlock);
    }
    currentId = match[1];
    currentStart = (match.index ?? 0) + match[0].length;
  }

  if (currentId) {
    blocks.set(currentId, source.slice(currentStart).trim());
  }

  return blocks;
}

function stripContentMarkers(source: string) {
  return source.replace(/<!--\s*content:[a-z0-9-]+\s*-->\n?/g, '');
}

async function compileContentBlock(source: string): Promise<ReactNode> {
  const { content } = await compileMDX({
    source,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkSlug as unknown as Plugin, remarkGfm as unknown as Plugin],
        rehypePlugins: [
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'wrap',
              properties: {
                className: 'no-underline hover:underline focus-visible:underline',
              },
            },
          ],
        ],
      },
    },
  });
  return content as ReactNode;
}

function getProductFilePath(productId: ProductId, locale: MarketLocale) {
  return path.join(marketingDirectory, `${productId}.${locale}.mdx`);
}

export async function loadProductDocument(
  productId: ProductId,
  locale: MarketLocale
): Promise<ProductDocument> {
  const source = await fs.readFile(getProductFilePath(productId, locale), 'utf8');
  const { frontmatter } = await compileMDX<ProductFrontMatterRaw>({
    source: stripContentMarkers(source),
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm as unknown as Plugin],
      },
    },
  });

  const parsed = frontMatterSchema.parse(frontmatter);
  const blocks = extractContentBlocks(stripFrontMatter(source));

  const surfaces: ProductSurface[] = await Promise.all(
    parsed.surfaceTabs.map(async (surface) => {
      const body = blocks.get(surface.id);
      if (!body) {
        throw new Error(`Missing content block for product "${productId}" surface "${surface.id}"`);
      }
      return { ...surface, content: await compileContentBlock(body) };
    })
  );

  const sections: ProductSection[] = await Promise.all(
    parsed.sections.map(async (section) => {
      const body = blocks.get(section.id);
      if (!body) {
        throw new Error(`Missing content block for product "${productId}" section "${section.id}"`);
      }
      return { ...section, content: await compileContentBlock(body) };
    })
  );

  const frontMatter: ProductFrontMatter = {
    title: parsed.title,
    description: parsed.description,
    surfacesEyebrow: parsed.surfacesEyebrow,
    surfacesTitle: parsed.surfacesTitle,
    surfacesIntro: parsed.surfacesIntro,
  };

  return {
    id: productId,
    meta: PRODUCT_META[productId],
    frontMatter,
    surfaces,
    sections,
  };
}
