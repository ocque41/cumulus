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

const VERIFIED_PUBLIC_URLS = new Set([
  "https://github.com/ocque41?tab=repositories",
  "https://github.com/git/git",
  "https://git-scm.com/docs/git-mktag/2.43.0/",
  "https://git-scm.com/docs/git-fsck/2.55.0/",
  "https://github.com/apple/container/blob/main/docs/container-machine.md",
  "https://developers.openai.com/codex/cli/",
  "https://platform.cumulush.com",
  "https://csrc.nist.gov/pubs/sp/800/207/final",
  "https://csrc.nist.gov/pubs/sp/800/162/upd2/final",
  "https://www.rfc-editor.org/rfc/rfc5116.html",
  "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10",
  "https://reproducible-builds.org/docs/definition/",
  "https://slsa.dev/spec/v1.2/",
  "https://git-scm.com/docs/git-ls-files",
  "https://toml.io/en/v1.0.0",
  "https://www.jsonrpc.org/specification",
  "https://json-schema.org/specification",
  "https://www.rfc-editor.org/rfc/rfc9110.html",
  "https://csrc.nist.gov/pubs/sp/800/34/r1/upd1/final",
  "https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories",
  "https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions",
]);

const EXPLORATION_URLS = new Set([
  "https://github.com/ocque41?tab=repositories",
  "https://platform.cumulush.com",
]);

const EXPECTED_PROJECTS = [
  "Room",
  "gy",
  "Local Harness",
  "TOML Agent",
  "Cumulus Platform",
  "Cumulus lab",
];

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

    for (const project of EXPECTED_PROJECTS) {
      const projectPosts = publishedPosts.filter((post) => post.project === project);
      expect(projectPosts.length, project).toBeGreaterThanOrEqual(4);
    }

    expect(new Set(publishedPosts.map((post) => post.date))).toEqual(
      new Set(["2026-07-16"]),
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

    expect([...sectionCounts].sort()).toEqual([4, 5, 6]);
  });

  it("uses only the exact links in the verified public-source registry", () => {
    const sources = POSTS.flatMap((post) => post.sourceLinks ?? []);
    expect(sources.length).toBeGreaterThan(0);

    for (const source of sources) {
      const url = new URL(source.href);
      expect(source.label.trim()).not.toBe("");
      expect(url.protocol).toBe("https:");
      expect(url.username).toBe("");
      expect(url.password).toBe("");
      expect(VERIFIED_PUBLIC_URLS.has(source.href), source.href).toBe(true);
      if (EXPLORATION_URLS.has(source.href)) {
        expect(source.label).toMatch(/^Explore /);
      }
    }

    for (const post of publishedPosts) {
      const claimSources = (post.sourceLinks ?? []).filter(
        (source) => !EXPLORATION_URLS.has(source.href),
      );
      expect(claimSources.length, post.slug).toBeGreaterThan(0);
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
      /127\.0\.0\.1/,
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
    const tomlResults = searchPublishedPosts("TOML Agent");
    const tomlProjectSlugs = publishedPosts
      .filter((post) => post.project === "TOML Agent")
      .map((post) => post.slug);
    expect(tomlResults.map((post) => post.slug)).toEqual(
      expect.arrayContaining(tomlProjectSlugs),
    );

    const receiptResults = searchPublishedPosts("content-bound receipt");
    expect(receiptResults.map((post) => post.slug)).toEqual([
      "preview-before-mutation",
    ]);
  });

  it("combines case-insensitive category and text filters", () => {
    const results = searchPublishedPosts("boundary", " security ");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((post) => post.category === "Security")).toBe(true);
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
