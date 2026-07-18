import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Post } from "@/content/posts";

vi.mock("@/components/github/GitHubContributionGraph", () => ({
  GitHubContributionGraph: () => <div data-testid="github-graph" />,
}));

vi.mock("@/components/visual/HeroDither", () => ({
  HeroDither: () => <div data-slot="hero-dither" />,
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

afterEach(cleanup);

describe("HomePage field notes", () => {
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
