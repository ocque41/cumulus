import postsData from "./posts.json" with { type: "json" };
import {
  DITHER_VARIANTS,
  type Post,
  type PostBodySection,
} from "./post-types.js";

export type {
  DitherVariant,
  Post,
  PostBodySection,
  PostPlacement,
  PostStatus,
  PostVisual,
} from "./post-types.js";

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DITHER_VARIANT_SET = new Set<string>(DITHER_VARIANTS);
const PROJECT_CATEGORIES = new Map([
  ["requisia", "Requisia"],
  ["insuja", "Insuja"],
  ["hyoka-hanesu", "Hyoka Hanesu"],
  ["gy", "gy"],
]);

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isSafeHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.username === "" &&
      url.password === "" &&
      !["localhost", "127.0.0.1", "::1"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export function countBodyWords(body: readonly PostBodySection[]): number {
  return body.reduce(
    (sectionTotal, bodySection) =>
      sectionTotal +
      bodySection.paragraphs.reduce(
        (paragraphTotal, paragraph) =>
          paragraphTotal + paragraph.trim().split(/\s+/).filter(Boolean).length,
        0,
      ),
    0,
  );
}

export function calculateReadingTime(body: readonly PostBodySection[]): number {
  return Math.max(1, Math.ceil(countBodyWords(body) / 220));
}

const RAW_POSTS = postsData as unknown as readonly Omit<Post, "readingTime">[];

export const POSTS: readonly Post[] = RAW_POSTS.map((post) => ({
  ...post,
  readingTime: calculateReadingTime(post.body),
}));

export function validatePosts(posts: readonly Post[] = POSTS): string[] {
  const issues: string[] = [];
  const slugs = new Set<string>();
  const publishedSlugs = new Set(
    posts.filter((post) => post.status === "published").map((post) => post.slug),
  );

  const featuredCount = posts.filter(
    (post) => post.status === "published" && post.placement === "featured",
  ).length;
  if (featuredCount !== 1) {
    issues.push(`Expected exactly one featured published post, received ${featuredCount}.`);
  }

  posts.forEach((post, index) => {
    const label = post.slug || `post at index ${index}`;
    if (!SLUG_PATTERN.test(post.slug)) issues.push(`${label}: slug must use lowercase kebab case.`);
    if (slugs.has(post.slug)) issues.push(`${label}: slug must be unique.`);
    slugs.add(post.slug);
    if (!post.title.trim()) issues.push(`${label}: title is required.`);
    if (!post.excerpt.trim()) issues.push(`${label}: excerpt is required.`);
    if (!isValidDate(post.date)) issues.push(`${label}: date must be a valid YYYY-MM-DD value.`);
    if (!post.category.trim()) issues.push(`${label}: category is required.`);

    if (post.category === "Editorial") {
      if (post.project) issues.push(`${label}: Editorial posts cannot set a project.`);
    } else if (!post.project || PROJECT_CATEGORIES.get(post.project) !== post.category) {
      issues.push(`${label}: project and category must use an approved Cumulus pairing.`);
    }

    const expectedReadingTime = calculateReadingTime(post.body);
    if (!Number.isInteger(post.readingTime) || post.readingTime !== expectedReadingTime) {
      issues.push(`${label}: readingTime must be calculated from body length.`);
    }
    if (post.tags.length < 2 || post.tags.some((tag) => !tag.trim())) {
      issues.push(`${label}: at least two non-empty tags are required.`);
    }
    if (new Set(post.tags.map(normalized)).size !== post.tags.length) {
      issues.push(`${label}: tags must be unique within a post.`);
    }
    if (!DITHER_VARIANT_SET.has(post.visual.variant) || !post.visual.alt.trim()) {
      issues.push(`${label}: visual variant and alternative text are required.`);
    }
    if (post.body.length < 1 || post.body.length > 6) {
      issues.push(`${label}: body must contain between one and six sections.`);
    }
    if (post.status === "published" && countBodyWords(post.body) < 3) {
      issues.push(`${label}: published body must contain at least three words.`);
    }
    post.body.forEach((bodySection, sectionIndex) => {
      if (!bodySection.heading.trim()) {
        issues.push(`${label}: body section ${sectionIndex + 1} needs a heading.`);
      }
      if (
        bodySection.paragraphs.length < 1 ||
        bodySection.paragraphs.some((paragraph) => paragraph.trim().length < 10)
      ) {
        issues.push(
          `${label}: body section ${sectionIndex + 1} needs at least one substantial paragraph.`,
        );
      }
    });

    const sourceKeys = new Set<string>();
    for (const source of post.sourceLinks ?? []) {
      const key = `${normalized(source.label)}\n${source.href}`;
      if (!source.label.trim() || !isSafeHttpsUrl(source.href)) {
        issues.push(`${label}: source links need a label and a safe HTTPS URL.`);
      }
      if (sourceKeys.has(key)) issues.push(`${label}: source links must be unique.`);
      sourceKeys.add(key);
    }

    const related = post.relatedSlugs ?? [];
    if (new Set(related).size !== related.length) {
      issues.push(`${label}: related slugs must be unique.`);
    }
    for (const relatedSlug of related) {
      if (relatedSlug === post.slug) issues.push(`${label}: a post cannot relate to itself.`);
      else if (!publishedSlugs.has(relatedSlug)) {
        issues.push(`${label}: related slug ${relatedSlug} must resolve to a published post.`);
      }
    }

    if (post.status === "published" && !post.verifiedAt) {
      issues.push(`${label}: published posts need a verifiedAt date.`);
    } else if (post.verifiedAt && !isValidDate(post.verifiedAt)) {
      issues.push(`${label}: verifiedAt must be a valid YYYY-MM-DD value.`);
    }
    if (index > 0 && posts[index - 1].date < post.date) {
      issues.push(`${label}: posts must be in non-increasing date order.`);
    }
  });

  return issues;
}

export const publishedPosts: readonly Post[] = POSTS.filter(
  (post) => post.status === "published",
);

export const featuredPost: Post = publishedPosts.find(
  (post) => post.placement === "featured",
)!;

export function getPublishedPostBySlug(slug: string): Post | undefined {
  const normalizedSlug = normalized(slug);
  return publishedPosts.find((post) => post.slug === normalizedSlug);
}

export function searchPublishedPosts(query = "", category?: string): readonly Post[] {
  const terms = normalized(query).split(/\s+/).filter(Boolean);
  const normalizedCategory = normalized(category ?? "all");
  return publishedPosts.filter((post) => {
    const categoryMatches =
      !normalizedCategory ||
      normalizedCategory === "all" ||
      normalized(post.category) === normalizedCategory;
    if (!categoryMatches) return false;
    if (terms.length === 0) return true;
    const searchableText = normalized(
      [
        post.title,
        post.excerpt,
        post.category,
        post.project ?? "",
        ...post.tags,
        ...post.body.flatMap((bodySection) => [
          bodySection.heading,
          ...bodySection.paragraphs,
        ]),
      ].join(" "),
    );
    return terms.every((term) => searchableText.includes(term));
  });
}
