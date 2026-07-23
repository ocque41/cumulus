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
  CompactPostRow: ({ post }: { post: Post }) => (
    <article><a href={`/logs/${post.slug}`}>{post.title}</a></article>
  ),
  FeaturedPost: ({ post }: { post: Post }) => (
    <article data-slug={post.slug} data-testid="featured-post" />
  ),
}));

import { CONTENT_AREAS } from "@/content/areas";
import { homePreviousPosts, latestPost, publishedPosts } from "@/content/posts";
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

  it("caps the homepage at one latest log and four previous logs", () => {
    const { container } = render(<HomePage onOpenAuth={vi.fn()} />);
    const latest = within(document.body).getByTestId("featured-post");
    const chain = container.querySelector(".compact-post-chain");

    expect(latest).toHaveAttribute("data-slug", latestPost.slug);
    expect(chain).toHaveAttribute(
      "data-card-count",
      String(Math.min(4, publishedPosts.length - 1)),
    );
    expect(chain?.children).toHaveLength(homePreviousPosts.length);
    homePreviousPosts.forEach((post) => {
      expect(within(chain as HTMLElement).getByRole("link", { name: post.title }))
        .toHaveAttribute("href", `/logs/${post.slug}`);
    });
  });

  it("renders all approved areas without rendering their full post lists", () => {
    const { container } = render(<HomePage onOpenAuth={vi.fn()} />);
    const cards = container.querySelectorAll(".area-overview-card");

    expect(cards).toHaveLength(CONTENT_AREAS.length);
    CONTENT_AREAS.forEach((area) => {
      expect(within(document.body).getByRole("link", { name: area.category }))
        .toHaveAttribute("href", `/areas/${area.slug}`);
    });
  });
});
