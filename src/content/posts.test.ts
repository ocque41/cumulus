import { describe, expect, it } from "vitest";

import {
  POSTS,
  calculateReadingTime,
  countBodyWords,
  featuredPost,
  getAdjacentPublishedPosts,
  homePreviousPosts,
  latestPost,
  getPublishedPostBySlug,
  publishedPosts,
  searchPublishedPosts,
  validatePosts,
  type Post,
} from "./posts";
import { FIRST_PARTY_JOURNAL_NOTICE } from "./focused-posts";

const EXPECTED_PROJECTS = new Map([
  ["requisia", "Requisia"],
  ["insuja", "Insuja"],
  ["hyoka-hanesu", "Hyoka Hanesu"],
  ["gy", "gy"],
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
  it("publishes a valid, ordered catalog without a fixed post count", () => {
    expect(publishedPosts.length).toBeGreaterThan(0);
    expect(new Set(POSTS.map((post) => post.slug)).size).toBe(POSTS.length);

    for (const [project, category] of EXPECTED_PROJECTS) {
      const projectPosts = publishedPosts.filter((post) => post.project === project);
      expect(projectPosts.every((post) => post.category === category)).toBe(true);
    }

    expect(
      POSTS.every(
        (post, index) => index === 0 || POSTS[index - 1].date >= post.date,
      ),
    ).toBe(true);
    expect(validatePosts()).toEqual([]);
  });

  it("gives every published journal valid, topic-specific copy without padding short posts", () => {
    const seenParagraphs = new Map<string, string>();
    const sectionCounts = new Set<number>();

    for (const post of publishedPosts) {
      expect(post.title.trim().length).toBeGreaterThan(5);
      expect(post.excerpt.trim().length).toBeGreaterThan(40);
      if (post.category !== "Editorial") expect(post.project?.trim()).not.toBe("");
      expect(post.tags.length).toBeGreaterThanOrEqual(2);
      expect(new Set(post.tags.map((tag) => tag.toLocaleLowerCase("en-US"))).size)
        .toBe(post.tags.length);

      const bodyWords = countBodyWords(post.body);
      expect(bodyWords, post.slug).toBeGreaterThan(0);
      expect(post.readingTime, post.slug).toBe(calculateReadingTime(post.body));
      expect(post.visual.alt.trim().length).toBeGreaterThan(24);
      expect(post.body.length).toBeGreaterThanOrEqual(1);
      expect(post.body.length).toBeLessThanOrEqual(6);
      expect(post.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      sectionCounts.add(post.body.length);

      if (post.category !== "Editorial") {
        const completeBody = post.body
          .flatMap((bodySection) => bodySection.paragraphs)
          .join(" ");
        expect(completeBody, post.slug).toMatch(
          /evidence|first-party|private|production|deployment|public/i,
        );
      }

      for (const bodySection of post.body) {
        expect(bodySection.heading.trim().length).toBeGreaterThan(4);
        expect(bodySection.paragraphs.length).toBeGreaterThanOrEqual(1);
        for (const paragraph of bodySection.paragraphs) {
          expect(paragraph.trim().length).toBeGreaterThanOrEqual(40);
          const normalized = paragraph.trim().replace(/\s+/g, " ");
          expect(
            seenParagraphs.get(normalized),
            `${post.slug} repeats a paragraph from ${seenParagraphs.get(normalized)}`,
          ).toBeUndefined();
          seenParagraphs.set(normalized, post.slug);
        }
      }
    }

    expect(sectionCounts).toContain(4);
    expect(sectionCounts).toContain(5);
  });

  it("publishes one explicit authorship notice without a corpus-wide prose formula", () => {
    expect(FIRST_PARTY_JOURNAL_NOTICE.label).toBe(
      "Maintainer-authored first-party journal",
    );
    expect(FIRST_PARTY_JOURNAL_NOTICE.detail).toMatch(
      /private evidence.*no public-source.*production verification/i,
    );

    const formulaicEvidenceOpenings = publishedPosts.filter((post) => {
      const openingEvidenceParagraph = post.body[0]?.paragraphs[1] ?? "";
      return /(?:private|first-party).{0,45}(?:material|materials|work|design).{0,45}(?:reviewed|examined|observed)/i
        .test(openingEvidenceParagraph);
    });
    const formulaicClosings = publishedPosts.filter((post) => {
      const closing = post.body.at(-1)?.paragraphs.at(-1) ?? "";
      return /(?:until (?:then|that|such)|the (?:accurate|defensible|honest) (?:claim|conclusion|statement)|this (?:public )?(?:article|journal|note) (?:does not|cannot|claims no|makes no))/i
        .test(closing);
    });

    expect(formulaicEvidenceOpenings).toHaveLength(0);
    expect(formulaicClosings.length).toBeLessThanOrEqual(4);
  });

  it("uses the first-party journal boundary without invented source links", () => {
    const serialized = JSON.stringify(POSTS);
    expect(serialized).not.toMatch(
      /\/Users\/|\/private\/|localhost|127\.0\.0\.1|ocque41/i,
    );
    expect(serialized).not.toMatch(
      /api[_-]?key|service[_-]?role|access[_-]?token|customer[_-]?id/i,
    );
  });

  it("selects the newest five homepage logs without using placement", () => {
    expect(latestPost).toBe(publishedPosts[0]);
    expect(featuredPost).toBe(latestPost);
    expect(homePreviousPosts).toEqual(publishedPosts.slice(1, 5));
    expect([latestPost, ...homePreviousPosts]).toHaveLength(5);

    const placements = new Set(publishedPosts.map((post) => post.placement));
    expect(placements).toEqual(
      new Set([
        "featured",
        "recent",
        "stories",
        "research",
        "build-business",
      ]),
    );
  });

  it("resolves every related backlink to a different published journal", () => {
    const publishedSlugs = new Set(publishedPosts.map((post) => post.slug));

    for (const post of POSTS) {
      expect(new Set(post.relatedSlugs).size).toBe(post.relatedSlugs?.length);
      for (const relatedSlug of post.relatedSlugs ?? []) {
        expect(relatedSlug).not.toBe(post.slug);
        expect(publishedSlugs.has(relatedSlug), `${post.slug} -> ${relatedSlug}`).toBe(
          true,
        );
      }
    }
  });

  it("accepts a short Editorial post with a generated Cumulus visual", () => {
    const posts = editablePosts();
    const body = [{
      heading: "A small public note",
      paragraphs: [
        "A focused thought.",
      ],
    }];
    posts.unshift({
      slug: "a-small-public-note",
      title: "A small public note",
      excerpt: "A compact editorial that keeps the author’s facts while applying the Cumulus publishing structure.",
      status: "published",
      date: POSTS[0].date,
      category: "Editorial",
      tags: ["Publishing", "Editorial"],
      readingTime: calculateReadingTime(body),
      placement: "recent",
      visual: {
        variant: "signal-window",
        alt: "Animated dither signal window framing a compact editorial note",
      },
      body,
      verifiedAt: POSTS[0].date,
    });

    expect(validatePosts(posts)).toEqual([]);
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

  it("selects the latest log and resolves a normalized slug", () => {
    expect(featuredPost).toBe(publishedPosts[0]);
    expect(getPublishedPostBySlug(`  ${featuredPost.slug.toUpperCase()}  `)).toBe(
      featuredPost,
    );
  });

  it("resolves newer and older chronological neighbors", () => {
    expect(getAdjacentPublishedPosts(publishedPosts[0])).toEqual({
      older: publishedPosts[1],
    });
    expect(getAdjacentPublishedPosts(publishedPosts[1])).toEqual({
      newer: publishedPosts[0],
      older: publishedPosts[2],
    });
    expect(getAdjacentPublishedPosts(publishedPosts.at(-1)!)).toEqual({
      newer: publishedPosts.at(-2),
    });
  });
});

describe("searchPublishedPosts", () => {
  it("matches project metadata and unique article language", () => {
    const requisia = searchPublishedPosts("requisia");
    expect(requisia.length).toBeGreaterThanOrEqual(8);
    expect(requisia).toEqual(
      expect.arrayContaining(
        publishedPosts.filter((post) => post.project === "requisia"),
      ),
    );

    const phrase = publishedPosts[0].tags.at(-1)!;
    expect(searchPublishedPosts(phrase).map((post) => post.slug)).toContain(
      publishedPosts[0].slug,
    );
  });

  it("combines case-insensitive category and text filters", () => {
    const results = searchPublishedPosts("boundary", " rEqUiSiA ");
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((post) => post.category === "Requisia")).toBe(true);
  });

  it("preserves published order for empty and all filters", () => {
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
      body: [{ heading: "", paragraphs: ["Short"] }],
    };

    const issues = validatePosts(posts);
    expect(issues).toContain(
      `${posts[0].slug}: date must be a valid YYYY-MM-DD value.`,
    );
    expect(issues).toContain(
      `${posts[0].slug}: published body must contain at least three words.`,
    );
    expect(issues).toContain(
      `${posts[0].slug}: body section 1 needs a heading.`,
    );
    expect(issues).toContain(
      `${posts[0].slug}: body section 1 needs at least one substantial paragraph.`,
    );
    expect(issues).toContain(
      `${posts[1].slug}: posts must be in non-increasing date order.`,
    );
  });

  it("rejects unsafe source URLs when a future public review supplies them", () => {
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
