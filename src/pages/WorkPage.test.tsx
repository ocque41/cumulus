import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publishedPosts } from "@/content/posts";
import { WORK_PROJECTS } from "@/content/work";

vi.mock("@/components/content/PostComponents", async () => {
  const actual = await vi.importActual<typeof import("@/components/content/PostComponents")>(
    "@/components/content/PostComponents",
  );
  return {
    ...actual,
    DitherPlate: ({ placement, post }: {
      placement: string;
      post: { slug: string };
    }) => (
      <span data-placement={placement} data-post-slug={post.slug} />
    ),
  };
});

vi.mock("@/components/visual/DitherArtwork", () => ({
  DitherArtwork: () => null,
}));

vi.mock("@/components/visual/HeroDither", () => ({
  HeroDither: () => null,
}));

import { WorkPage } from "./WorkPage";

afterEach(() => cleanup());

describe("WorkPage project journals", () => {
  it("renders every focused journal under its project with a dither plate", () => {
    const view = render(<WorkPage />);
    const projectPosts = publishedPosts.filter((post) => post.project);
    const journalLinks = Array.from(
      view.container.querySelectorAll<HTMLAnchorElement>(".work-project__notes a"),
    );
    const plates = Array.from(
      view.container.querySelectorAll<HTMLElement>("[data-post-slug]"),
    );

    expect(journalLinks).toHaveLength(projectPosts.length);
    expect(plates).toHaveLength(projectPosts.length);
    expect(new Set(journalLinks.map((link) => link.getAttribute("href"))).size).toBe(
      projectPosts.length,
    );

    for (const project of WORK_PROJECTS) {
      const expected = publishedPosts.filter((post) => post.project === project.slug);
      const projectArticle = view.container.querySelector(`#work-${project.slug}`);
      const projectLinks = projectArticle?.querySelectorAll(".work-project__notes a");
      const projectGrid = projectArticle?.querySelector<HTMLElement>(
        ".work-project__notes > [data-card-count]",
      );
      const projectPlates = projectArticle?.querySelectorAll(
        `[data-placement="work-${project.slug}"]`,
      );

      expect(projectLinks, project.slug).toHaveLength(expected.length);
      expect(projectGrid, project.slug).toHaveAttribute(
        "data-card-count",
        String(expected.length),
      );
      expect(projectPlates, project.slug).toHaveLength(expected.length);
    }
  });
});
