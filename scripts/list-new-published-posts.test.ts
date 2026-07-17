import { describe, expect, it } from "vitest";

import { listNewPublishedSlugs } from "./list-new-published-posts.mjs";

const original = {
  slug: "existing-log",
  title: "Existing log",
  excerpt: "Existing public field note.",
  date: "2026-07-16",
  status: "published",
};
const legacySlugs = Array.from({ length: 24 }, (_, index) => `legacy-${index + 1}`);
const legacyPosts = legacySlugs.map((slug) => ({ ...original, slug }));

describe("new published post selection", () => {
  it("returns every post outside the legacy baseline", () => {
    expect(listNewPublishedSlugs([
      { ...original, slug: "new-log", title: "New log", date: "2026-07-17" },
      ...legacyPosts,
    ], legacyPosts, legacySlugs)).toEqual(["new-log"]);
  });

  it("keeps a post eligible across later production revisions", () => {
    const notifiedEraPost = { ...original, slug: "new-log", title: "New log" };
    expect(listNewPublishedSlugs([
      notifiedEraPost,
      ...legacyPosts,
    ], [notifiedEraPost, ...legacyPosts], legacySlugs)).toEqual(["new-log"]);
  });

  it("rejects changed notification content under an existing slug", () => {
    expect(() => listNewPublishedSlugs([
      { ...legacyPosts[0], excerpt: "Rewritten after publication." },
      ...legacyPosts.slice(1),
    ], legacyPosts, legacySlugs)).toThrow(/excerpt changed for immutable slug legacy-1/);
  });

  it("rejects deletion and a baseline that does not exactly name the legacy set", () => {
    expect(() => listNewPublishedSlugs(
      legacyPosts.slice(1),
      legacyPosts,
      legacySlugs,
    )).toThrow(/immutable slug legacy-1 was deleted/);
    expect(() => listNewPublishedSlugs(
      legacyPosts,
      legacyPosts,
      [...legacySlugs.slice(0, -1), "wrong-legacy-slug"],
    )).toThrow(/baseline does not match/);
  });

  it("rejects malformed or duplicate published content", () => {
    expect(() => listNewPublishedSlugs([
      original,
      original,
    ], [], [])).toThrow(/duplicate slug existing-log/);
    expect(() => listNewPublishedSlugs([
      { ...original, status: "draft" },
    ], [])).toThrow(/invalid published post/);
  });
});
