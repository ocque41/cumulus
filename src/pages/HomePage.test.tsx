import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Post } from "@/content/posts";

const heroDitherProps = vi.hoisted(
  () => [] as Array<Record<string, unknown>>,
);

vi.mock("@/components/github/GitHubContributionGraph", () => ({
  GitHubContributionGraph: () => <div data-testid="github-graph" />,
}));

vi.mock("@/components/visual/HeroDither", () => ({
  HeroDither: (props: Record<string, unknown>) => {
    heroDitherProps.push(props);
    return <div data-slot="hero-dither" />;
  },
}));

vi.mock("@/components/visual/HomeHeroDither", () => ({
  HomeHeroDither: () => (
    <div data-slot="home-hero-dither-composition" data-testid="home-hero-dither" />
  ),
}));

vi.mock("@/features/notifications", () => ({
  NotificationPreferences: () => <div data-testid="notification-preferences" />,
}));

vi.mock("@/components/content/PostComponents", () => ({
  articleHref: (post: Pick<Post, "slug">) => `/logs/${post.slug}`,
  DitherPlate: ({ className = "" }: { className?: string }) => (
    <div aria-hidden="true" className={`dither-plate ${className}`} />
  ),
  FeaturedPost: () => <article data-testid="featured-post" />,
  PostCard: ({ post }: { post: Post }) => (
    <article><a href={`/logs/${post.slug}`}>{post.title}</a></article>
  ),
}));

import { publishedPosts } from "@/content/posts";
import { HomePage } from "./HomePage";

afterEach(() => {
  cleanup();
  heroDitherProps.length = 0;
});

describe("HomePage field notes", () => {
  it("renders the merged homepage field and drives the interlude with visible motion", () => {
    render(<HomePage onOpenAuth={vi.fn()} />);

    expect(within(document.body).getByTestId("home-hero-dither")).toBeVisible();
    expect(heroDitherProps).toHaveLength(1);
    expect(heroDitherProps[0]).toEqual(expect.objectContaining({
      shape: "ripple",
      speed: 0.48,
    }));
  });

  it("renders every post in complete count-aware grids", () => {
    const { container } = render(<HomePage onOpenAuth={vi.fn()} />);
    const placements = [
      ["recent", ".post-grid"],
      ["stories", ".field-note-grid"],
      ["research", ".post-grid"],
      ["build-business", ".field-note-grid"],
    ] as const;
    const grids = Array.from(
      container.querySelectorAll<HTMLElement>("[data-card-count]"),
    );

    expect(grids).toHaveLength(placements.length);
    placements.forEach(([placement, selector], index) => {
      const expectedCount = publishedPosts.filter(
        (post) => post.placement === placement,
      ).length;
      const grid = grids[index];
      expect(grid?.matches(selector)).toBe(true);
      expect(grid).toHaveAttribute("data-card-count", String(expectedCount));
      expect(grid?.children).toHaveLength(expectedCount);
    });
  });

  it("uses one descriptive stretched link per story and business card", () => {
    const { container } = render(<HomePage onOpenAuth={vi.fn()} />);
    const expected = [
      ...publishedPosts.filter((post) => post.placement === "stories"),
      ...publishedPosts.filter((post) => post.placement === "build-business"),
    ];
    const cards = container.querySelectorAll<HTMLElement>(".field-note");

    expect(cards).toHaveLength(expected.length);
    cards.forEach((card, index) => {
      const post = expected[index];
      if (!post) throw new Error("Expected a matching field-note post");
      const links = within(card).getAllByRole("link");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAccessibleName(post.title);
      expect(links[0]).toHaveAttribute("href", `/logs/${post.slug}`);
      expect(card.querySelector(".field-note__visual")?.tagName).toBe("DIV");
    });
  });
});
