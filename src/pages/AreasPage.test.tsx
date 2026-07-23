import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CONTENT_AREAS, postsForArea } from "@/content/areas";
import { publishedPosts } from "@/content/posts";

vi.mock("@/components/visual/HeroDither", () => ({
  HeroDither: () => <div data-testid="hero-dither" />,
}));

import { AreaArchivePage, AreasPage } from "./AreasPage";

afterEach(cleanup);

describe("AreasPage", () => {
  it("lists every approved category and its crawlable route", () => {
    render(<AreasPage />);

    CONTENT_AREAS.forEach((area) => {
      expect(screen.getByRole("link", { name: area.category }))
        .toHaveAttribute("href", `/areas/${area.slug}`);
    });
  });

  it("renders the requested chronological area page", () => {
    const area = CONTENT_AREAS[0];
    const posts = postsForArea(publishedPosts, area);
    render(<AreaArchivePage area={area} page={1} />);

    expect(screen.getByRole("heading", { level: 1, name: area.category })).toBeVisible();
    posts.forEach((post) => {
      expect(screen.getByRole("link", { name: post.title })).toBeVisible();
    });
  });
});
