import { RESEARCHED_POSTS } from "./researched-posts.js";
import type { Post, PostBodySection } from "./post-types.js";

export type {
  DitherVariant,
  Post,
  PostBodySection,
  PostPlacement,
  PostStatus,
  PostVisual,
} from "./post-types.js";

const DRAFT_POST: Post = {
  slug: "reviewing-the-next-public-system",
  title: "Reviewing the next public system",
  excerpt:
    "A draft checklist for turning a public repository into a bounded, source-backed Cumulus field note without overstating deployment or production evidence.",
  status: "draft",
  date: "2026-06-22",
  category: "Editorial",
  tags: ["Research method", "Public sources"],
  readingTime: 2,
  placement: "research",
  visual: {
    variant: "workspace-beacon",
    alt: "Dither study for a future public-source review",
  },
  body: [
    {
      heading: "Start at the public boundary",
      paragraphs: [
        "A repository can support a useful field note only when the cited material is anonymously reachable and the publication boundary is explicit. Local context may identify what deserves attention, but it cannot become a public claim until the matching source, history, or documentation is available without privileged access.",
        "The first review therefore records the repository snapshot, the exact files that support the topic, and the difference between source behavior and deployed behavior. A source file can prove that a guard exists in code; it cannot prove the production account, network, or operator configuration currently exercises it.",
      ],
    },
    {
      heading: "Trace the complete path",
      paragraphs: [
        "A robust analysis reads the owning documentation, immediate callers, focused tests, and failure paths instead of quoting a single attractive function. The goal is to explain the system boundary, the design decision, and the operational tradeoff in language that another reader can check against the linked code.",
        "Stable commit links keep that review reproducible. Mutable branch links are convenient during drafting, but a published note should preserve the source state that was actually reviewed so a later refactor does not silently change the evidence beneath the article.",
      ],
    },
    {
      heading: "Publish limits with the result",
      paragraphs: [
        "Every article should name what remains unproven: a mock does not establish provider compatibility, a migration does not establish live application, and a security control does not establish the absence of vulnerabilities. Those limits make the analysis stronger because they prevent one narrow artifact from absorbing unrelated claims.",
        "This entry remains a draft until a specific public repository, commit, source trail, and cross-article backlink set are selected. Draft isolation is intentional; the public archive and routes must expose only posts that have passed the same source and structure checks as the rest of the corpus.",
      ],
    },
  ],
  relatedSlugs: [
    "honest-github-activity-field",
    "wireframes-as-executable-handoffs",
  ],
};

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

export const POSTS: readonly Post[] = [...RESEARCHED_POSTS, DRAFT_POST].map(
  (post) => ({ ...post, readingTime: calculateReadingTime(post.body) }),
);

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

export function validatePosts(posts: readonly Post[] = POSTS): string[] {
  const issues: string[] = [];
  const slugs = new Set<string>();
  const publishedSlugs = new Set(
    posts.filter((post) => post.status === "published").map((post) => post.slug),
  );

  if (publishedSlugs.size < 20) {
    issues.push(`Expected at least 20 published posts, received ${publishedSlugs.size}.`);
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

    const expectedReadingTime = calculateReadingTime(post.body);
    if (!Number.isInteger(post.readingTime) || Math.abs(post.readingTime - expectedReadingTime) > 1) {
      issues.push(`${label}: readingTime must track body length at roughly 220 wpm.`);
    }
    if (post.tags.length < 2 || post.tags.some((tag) => !tag.trim())) {
      issues.push(`${label}: at least two non-empty tags are required.`);
    }
    if (new Set(post.tags.map(normalized)).size !== post.tags.length) {
      issues.push(`${label}: tags must be unique within a post.`);
    }
    if (!post.visual.variant || !post.visual.alt.trim()) {
      issues.push(`${label}: visual variant and alternative text are required.`);
    }
    if (post.body.length < 3 || post.body.length > 6) {
      issues.push(`${label}: body must contain between three and six sections.`);
    }
    if (post.status === "published" && countBodyWords(post.body) < 600) {
      issues.push(`${label}: published body must contain at least 600 words.`);
    }
    post.body.forEach((bodySection, sectionIndex) => {
      if (!bodySection.heading.trim()) {
        issues.push(`${label}: body section ${sectionIndex + 1} needs a heading.`);
      }
      if (
        bodySection.paragraphs.length < 2 ||
        bodySection.paragraphs.some((paragraph) => paragraph.trim().length < 80)
      ) {
        issues.push(`${label}: body section ${sectionIndex + 1} needs two substantial paragraphs.`);
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
    if (post.status === "published" && (post.sourceLinks?.length ?? 0) < 1) {
      issues.push(`${label}: published posts need a public primary-source backlink.`);
    }

    const related = post.relatedSlugs ?? [];
    if (post.status === "published" && related.length < 2) {
      issues.push(`${label}: published posts need at least two related backlinks.`);
    }
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

  if (!posts.some((post) => post.status === "draft")) {
    issues.push("At least one draft post is required to verify draft isolation.");
  }
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
