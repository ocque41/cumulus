import fs from "node:fs/promises";
import path from "node:path";

import type { ReactNode } from "react";

import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";
import remarkSlug from "remark-slug";
import type { Plugin } from "unified";
import type { Heading as MdastHeading } from "mdast";
import { toString } from "mdast-util-to-string";
import { visit } from "unist-util-visit";

import { legalMeta, productsCatalog, servicesCatalog } from "./data";
import {
  type LegalSlug,
  type SupportedLocale,
  supportedLocales,
} from "./schema";

export type LegalFrontMatter = {
  title: string;
  description: string;
  slug: string;
  lastUpdated?: string;
};

export type LegalHeading = {
  id: string;
  title: string;
  level: 2 | 3;
};

export type LoadedLegalDocument = {
  frontMatter: LegalFrontMatter;
  content: ReactNode;
  headings: LegalHeading[];
  locale: SupportedLocale;
};

const legalDirectory = path.join(process.cwd(), "src", "content", "legal");

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function loadMdxSource({
  slug,
  locale,
}: {
  slug: LegalSlug;
  locale: SupportedLocale;
}) {
  const localeFile = path.join(legalDirectory, `${slug}.${locale}.mdx`);

  try {
    return await fs.readFile(localeFile, "utf8");
  } catch {
    throw new Error(`Missing MDX file for ${slug} in locale ${locale}`);
  }
}

function createHeadingPlugin(target: LegalHeading[]): Plugin {
  return () => (tree) => {
    visit(tree, "heading", (node) => {
      const headingNode = node as MdastHeading;
      if (headingNode.depth === 2 || headingNode.depth === 3) {
        const title = toString(headingNode);
        const idFromData = headingNode.data && "id" in headingNode.data ? (headingNode.data as { id?: string }).id : undefined;
        const id = idFromData ?? slugify(title);

        target.push({
          id,
          title,
          level: headingNode.depth,
        });

        const data = (headingNode.data ?? {}) as Record<string, unknown>;
        data.id = id;
        headingNode.data = data;
      }
    });
  };
}

export async function loadLegalDocument({
  slug,
  locale,
}: {
  slug: LegalSlug;
  locale: SupportedLocale;
}): Promise<LoadedLegalDocument> {
  const fallbackLocale = legalMeta.legal.defaultLanguage;
  const localeToUse = supportedLocales.includes(locale) ? locale : fallbackLocale;
  const headings: LegalHeading[] = [];
  const source = await loadMdxSource({ slug, locale: localeToUse });

  const { content, frontmatter } = await compileMDX<LegalFrontMatter>({
    source,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [
          remarkSlug as unknown as Plugin,
          createHeadingPlugin(headings),
          remarkGfm as unknown as Plugin,
        ],
        rehypePlugins: [
          [
            rehypeAutolinkHeadings,
            {
              behavior: "wrap",
              properties: {
                className: "no-underline hover:underline focus-visible:underline",
              },
            },
          ],
        ],
      },
    },
    components: {
      ProcessorsTable: (await import("@/app/(legal)/components/ProcessorsTable")).ProcessorsTable,
      ProductsServicesList: (await import("@/app/(legal)/components/ProductsServicesList")).ProductsServicesList,
    },
  });

  return {
    frontMatter: frontmatter,
    content,
    headings,
    locale: localeToUse,
  };
}

export function getProductsAndServices() {
  return {
    products: productsCatalog,
    services: servicesCatalog,
  };
}
