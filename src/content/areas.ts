import type { Post } from "./post-types.js";

export const ARCHIVE_PAGE_SIZE = 10;
export const HOME_POST_LIMIT = 5;

export const CONTENT_AREAS = [
  {
    category: "Requisia",
    description: "Procurement operations, controls, evidence, and decision support.",
    slug: "requisia",
  },
  {
    category: "Insuja",
    description: "Controlled acquisition infrastructure and durable operating systems.",
    slug: "insuja",
  },
  {
    category: "Hyoka Hanesu",
    description: "Local repository assistance, review boundaries, and implementation practice.",
    slug: "hyoka-hanesu",
  },
  {
    category: "gy",
    description: "Git, forge, collaboration, and developer-workflow research.",
    slug: "gy",
  },
  {
    category: "Editorial",
    description: "Cumulus publishing notes, product decisions, and studio updates.",
    slug: "editorial",
  },
] as const;

export type ContentArea = (typeof CONTENT_AREAS)[number];
export type ContentAreaCategory = ContentArea["category"];
export type ContentAreaSlug = ContentArea["slug"];

const AREA_BY_SLUG = new Map<string, ContentArea>(
  CONTENT_AREAS.map((area) => [area.slug, area]),
);
const AREA_BY_CATEGORY = new Map<string, ContentArea>(
  CONTENT_AREAS.map((area) => [area.category, area]),
);

export function getAreaBySlug(slug: string): ContentArea | undefined {
  return AREA_BY_SLUG.get(slug.toLocaleLowerCase("en-US"));
}

export function getAreaByCategory(category: string): ContentArea | undefined {
  return AREA_BY_CATEGORY.get(category);
}

export function areaHref(area: Pick<ContentArea, "slug">, page = 1): string {
  return page > 1 ? `/areas/${area.slug}/page/${page}` : `/areas/${area.slug}`;
}

export function postsForArea(
  posts: readonly Post[],
  area: Pick<ContentArea, "category">,
): readonly Post[] {
  return posts.filter((post) => post.category === area.category);
}

export function pageCount(itemCount: number, pageSize = ARCHIVE_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(itemCount / pageSize));
}

export function pageItems<T>(
  items: readonly T[],
  page: number,
  pageSize = ARCHIVE_PAGE_SIZE,
): readonly T[] {
  if (!Number.isInteger(page) || page < 1) return [];
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
