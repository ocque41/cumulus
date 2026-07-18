import { cleanup, render, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Post } from "@/content/posts";

vi.mock("@/components/visual/DitherArtwork", () => ({
  stableDitherSeed: () => 17,
}));

vi.mock("@/components/visual/PostSignalArtwork", () => ({
  PostSignalArtwork: ({
    children,
    className,
    decorative,
    label,
  }: {
    children?: ReactNode;
    className?: string;
    decorative: boolean;
    label?: string;
  }) => (
    <div
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
      className={className}
      role={decorative ? undefined : "img"}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/visual/HeroDither", () => ({
  HeroDither: () => <div data-slot="hero-dither" />,
}));

import {
  FeaturedPost,
  PostCard,
  PostIndexRow,
} from "./PostComponents";

const post: Post = {
  body: [],
  category: "Systems",
  date: "2026-07-17",
  excerpt: "A focused public build note.",
  placement: "featured",
  readingTime: 4,
  slug: "one-practical-link",
  status: "published",
  tags: ["Accessibility", "Interfaces"],
  title: "One practical link",
  visual: {
    alt: "Dither field for the sample log",
    variant: "signal-window",
  },
};

afterEach(cleanup);

describe("post summary navigation", () => {
  it.each([
    ["featured post", <FeaturedPost key="featured" post={post} />],
    ["post card", <PostCard index={0} key="card" post={post} />],
    ["archive row", <PostIndexRow index={0} key="row" post={post} />],
  ])("gives the %s one descriptive link and decorative artwork", (_name, view) => {
    const { container } = render(view);
    const article = container.querySelector("article");

    expect(article).not.toBeNull();
    const links = within(article as HTMLElement).getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(post.title);
    expect(links[0]).toHaveAttribute("href", "/logs/one-practical-link");
    expect(article?.querySelector(".dither-plate")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("keeps visible direction copy out of the interactive control tree", () => {
    const featured = render(<FeaturedPost post={post} />);
    const featuredAction = featured.container.querySelector(
      ".featured-post__action",
    );

    expect(featuredAction?.tagName).toBe("SPAN");
    expect(featuredAction?.closest("a, button")).toBeNull();
    expect(featuredAction).not.toHaveClass("text-link");

    featured.rerender(<PostIndexRow index={0} post={post} />);
    const archiveAction = featured.container.querySelector(
      ".post-index-row__action",
    );

    expect(archiveAction?.tagName).toBe("SPAN");
    expect(archiveAction?.closest("a, button")).toBeNull();
  });
});
