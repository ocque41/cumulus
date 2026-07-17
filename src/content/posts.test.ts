import { describe, expect, it } from "vitest";

import {
  POSTS,
  calculateReadingTime,
  countBodyWords,
  featuredPost,
  getPublishedPostBySlug,
  publishedPosts,
  searchPublishedPosts,
  validatePosts,
  type Post,
} from "./posts";

const EXPECTED_REPOSITORY_COMMITS = new Map<string, ReadonlySet<string>>([
  ["cumulus", new Set([
    "ec98f05dece09b3a4ed48468f90a24639b3e848b",
    "89db41e8b089f73efc45f822049473ae8942e02a",
  ])],
  ["grok-build", new Set(["4508303932620fac40a63541d18be83609609240"])],
  ["psicoayuda", new Set(["13bd5fe471e8be651a6782560a88349741274caa"])],
  ["skills", new Set(["724413ac4ffaa5abddc8ba7a6342c8f9c86cce92"])],
  ["rune", new Set(["d0a73dd0fa99c7a001eea954e7066ec32a4416b7"])],
  ["relay", new Set(["5f8f116bb1cd82db789e165c2e22bd5566cfe952"])],
]);

function editablePosts(): Post[] {
  return POSTS.map((post) => ({
    ...post,
    tags: [...post.tags],
    visual: { ...post.visual },
    sourceLinks: post.sourceLinks?.map((source) => ({ ...source })),
    relatedSlugs: post.relatedSlugs ? [...post.relatedSlugs] : undefined,
    body: post.body.map((bodySection) => ({
      ...bodySection,
      paragraphs: [...bodySection.paragraphs],
    })),
  }));
}

describe("POSTS", () => {
  it("publishes at least 24 substantial posts across every audited project family", () => {
    expect(publishedPosts.length).toBeGreaterThanOrEqual(24);
    expect(new Set(POSTS.map((post) => post.slug)).size).toBe(POSTS.length);
    expect(POSTS.some((post) => post.status === "draft")).toBe(true);

    for (const project of EXPECTED_REPOSITORY_COMMITS.keys()) {
      const projectPosts = publishedPosts.filter((post) => post.project === project);
      expect(projectPosts.length, project).toBeGreaterThanOrEqual(4);
    }

    expect(new Set(publishedPosts.map((post) => post.date)).size).toBe(
      publishedPosts.length,
    );
    expect(
      POSTS.every(
        (post, index) => index === 0 || POSTS[index - 1].date >= post.date,
      ),
    ).toBe(true);
    expect(validatePosts()).toEqual([]);
  });

  it("gives every published post at least 600 meaningful body words", () => {
    const sectionCounts = new Set<number>();

    for (const post of publishedPosts) {
      expect(post.title.trim().length).toBeGreaterThan(10);
      expect(post.excerpt.trim().length).toBeGreaterThan(80);
      expect(post.project?.trim()).not.toBe("");
      expect(post.category.trim()).not.toBe("");
      expect(post.tags.length).toBeGreaterThanOrEqual(2);
      const bodyWords = countBodyWords(post.body);
      expect(bodyWords, post.slug).toBeGreaterThanOrEqual(600);
      expect(
        Math.abs(post.readingTime - calculateReadingTime(post.body)),
        post.slug,
      ).toBeLessThanOrEqual(1);
      expect(post.visual.variant.trim()).not.toBe("");
      expect(post.visual.alt.trim().length).toBeGreaterThan(20);
      expect(post.body.length).toBeGreaterThanOrEqual(3);
      expect(post.body.length).toBeLessThanOrEqual(6);
      sectionCounts.add(post.body.length);
      expect(post.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(`${post.verifiedAt}T00:00:00.000Z`))).toBe(
        false,
      );

      for (const bodySection of post.body) {
        expect(bodySection.heading.trim().length).toBeGreaterThan(4);
        expect(bodySection.paragraphs.length).toBeGreaterThanOrEqual(2);
        for (const paragraph of bodySection.paragraphs) {
          expect(paragraph.trim().length).toBeGreaterThanOrEqual(80);
        }
      }
    }

    expect([...sectionCounts].sort()).toEqual([5, 6]);
  });

  it("uses immutable source links for the six verified public repositories", () => {
    const sources = POSTS.flatMap((post) => post.sourceLinks ?? []);
    expect(sources.length).toBeGreaterThan(0);

    for (const source of sources) {
      const url = new URL(source.href);
      expect(source.label.trim()).not.toBe("");
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
      const match = source.href.match(
        /^https:\/\/github\.com\/ocque41\/([^/]+)\/blob\/([a-f0-9]{40})\/.+$/,
      );
      expect(match, source.href).not.toBeNull();
      expect(
        EXPECTED_REPOSITORY_COMMITS.get(match?.[1] ?? "")?.has(match?.[2] ?? ""),
        source.href,
      ).toBe(true);
    }

    for (const post of publishedPosts) {
      expect(post.sourceLinks?.length, post.slug).toBe(3);
    }
  });

  it("resolves every related backlink to a published post", () => {
    const publishedSlugs = new Set(publishedPosts.map((post) => post.slug));

    for (const post of POSTS) {
      expect(post.relatedSlugs?.length ?? 0).toBeGreaterThanOrEqual(2);
      expect(new Set(post.relatedSlugs).size).toBe(post.relatedSlugs?.length);
      for (const relatedSlug of post.relatedSlugs ?? []) {
        expect(relatedSlug).not.toBe(post.slug);
        expect(publishedSlugs.has(relatedSlug), `${post.slug} -> ${relatedSlug}`).toBe(
          true,
        );
      }
    }
  });

  it("contains no local paths, local endpoints, or inaccessible project backlinks", () => {
    const serialized = JSON.stringify(POSTS);
    const forbidden = [
      /\/Users\//i,
      /\/private\//i,
      /localhost/i,
    ];

    for (const pattern of forbidden) {
      expect(serialized).not.toMatch(pattern);
    }
  });
});

describe("published post selectors", () => {
  it("keeps the draft out of lookup and full-text search", () => {
    const draft = POSTS.find((post) => post.status === "draft");

    expect(draft).toBeDefined();
    expect(publishedPosts.every((post) => post.status === "published")).toBe(true);
    expect(getPublishedPostBySlug(draft!.slug)).toBeUndefined();
    expect(searchPublishedPosts(draft!.title)).toEqual([]);
  });

  it("selects the published feature and resolves a normalized slug", () => {
    expect(featuredPost.placement).toBe("featured");
    expect(featuredPost.status).toBe("published");
    expect(getPublishedPostBySlug(`  ${featuredPost.slug.toUpperCase()}  `)).toBe(
      featuredPost,
    );
  });
});

describe("searchPublishedPosts", () => {
  it("matches all terms across project metadata and body copy", () => {
    const skillsResults = searchPublishedPosts("skills");
    const skillsProjectSlugs = publishedPosts
      .filter((post) => post.project === "skills")
      .map((post) => post.slug);
    expect(skillsResults.map((post) => post.slug)).toEqual(
      expect.arrayContaining(skillsProjectSlugs),
    );

    const graphResults = searchPublishedPosts("fixed-user server boundary");
    expect(graphResults.map((post) => post.slug)).toContain(
      "honest-github-activity-field",
    );
  });

  it("combines case-insensitive category and text filters", () => {
    const results = searchPublishedPosts("boundary", " grok-build ");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((post) => post.category === "grok-build")).toBe(true);
  });

  it("preserves published date order for empty and all filters", () => {
    expect(searchPublishedPosts()).toEqual(publishedPosts);
    expect(searchPublishedPosts("", "ALL")).toEqual(publishedPosts);
    expect(searchPublishedPosts("", "not-a-category")).toEqual([]);
  });
});

describe("validatePosts", () => {
  it("reports duplicate slugs and unresolved backlinks", () => {
    const posts = editablePosts();
    posts[1] = {
      ...posts[1],
      slug: posts[0].slug,
      relatedSlugs: ["missing-published-post", ...(posts[1].relatedSlugs ?? [])],
    };

    const issues = validatePosts(posts);
    expect(issues).toContain(`${posts[0].slug}: slug must be unique.`);
    expect(issues).toContain(
      `${posts[0].slug}: related slug missing-published-post must resolve to a published post.`,
    );
  });

  it("reports malformed body content and date ordering", () => {
    const posts = editablePosts();
    posts[0] = {
      ...posts[0],
      date: "0000-00-00",
      body: [{ heading: "", paragraphs: ["Only one short paragraph."] }],
    };

    const issues = validatePosts(posts);
    expect(issues).toContain(
      `${posts[0].slug}: date must be a valid YYYY-MM-DD value.`,
    );
    expect(issues).toContain(
      `${posts[0].slug}: body must contain between three and six sections.`,
    );
    expect(issues).toContain(
      `${posts[0].slug}: body section 1 needs a heading.`,
    );
    expect(issues).toContain(
      `${posts[0].slug}: body section 1 needs two substantial paragraphs.`,
    );
    expect(issues).toContain(
      `${posts[1].slug}: posts must be in non-increasing date order.`,
    );
  });

  it("rejects unsafe source URLs", () => {
    const posts = editablePosts();
    posts[0] = {
      ...posts[0],
      sourceLinks: [{ label: "Unsafe", href: "http://localhost:3000/private" }],
    };

    expect(validatePosts(posts)).toContain(
      `${posts[0].slug}: source links need a label and a safe HTTPS URL.`,
    );
  });

  it("rejects an invalid verification date", () => {
    const posts = editablePosts();
    posts[0] = { ...posts[0], verifiedAt: "2026-02-31" };

    expect(validatePosts(posts)).toContain(
      `${posts[0].slug}: verifiedAt must be a valid YYYY-MM-DD value.`,
    );
  });
});
