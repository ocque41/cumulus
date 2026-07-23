import { describe, expect, it } from "vitest";

import { publishedPosts } from "./posts";
import {
  ARCHIVE_PAGE_SIZE,
  CONTENT_AREAS,
  areaHref,
  getAreaByCategory,
  getAreaBySlug,
  pageCount,
  pageItems,
  postsForArea,
} from "./areas";

describe("content areas", () => {
  it("maps every published post to one of five approved routes", () => {
    expect(CONTENT_AREAS).toHaveLength(5);
    for (const post of publishedPosts) {
      const area = getAreaByCategory(post.category);
      expect(area, post.slug).toBeDefined();
      expect(getAreaBySlug(area!.slug)).toBe(area);
      expect(areaHref(area!)).toBe(`/areas/${area!.slug}`);
    }
  });

  it("keeps chronological catalog order inside each area", () => {
    for (const area of CONTENT_AREAS) {
      const areaPosts = postsForArea(publishedPosts, area);
      expect(areaPosts).toEqual(
        publishedPosts.filter((post) => post.category === area.category),
      );
    }
  });

  it("paginates collections at ten records and rejects invalid pages", () => {
    expect(ARCHIVE_PAGE_SIZE).toBe(10);
    expect(pageCount(21)).toBe(3);
    expect(pageItems(publishedPosts, 1)).toEqual(publishedPosts.slice(0, 10));
    expect(pageItems(publishedPosts, 3)).toEqual(publishedPosts.slice(20, 30));
    expect(pageItems(publishedPosts, 0)).toEqual([]);
  });
});
