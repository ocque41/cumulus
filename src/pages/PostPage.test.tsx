import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publishedPosts, type Post } from "@/content/posts";

vi.mock("@/components/content/PostComponents", async () => {
  const actual = await vi.importActual<typeof import("@/components/content/PostComponents")>(
    "@/components/content/PostComponents",
  );
  return {
    ...actual,
    DitherPlate: () => null,
  };
});

vi.mock("@/features/notifications", () => ({
  NotificationPreferences: () => null,
}));

import { PostPage } from "./PostPage";

afterEach(() => cleanup());

describe("PostPage evidence mode", () => {
  it("identifies every focused route as a maintainer-authored first-party journal", () => {
    for (const post of publishedPosts.filter((entry) => entry.category !== "Editorial")) {
      const view = render(<PostPage post={post} />);
      const notice = view.container.querySelector(".article-evidence-label");

      expect(notice, post.slug).toHaveTextContent(
        "Maintainer-authored first-party journal.",
      );
      expect(notice, post.slug).toHaveTextContent(
        "Approved product reasoning from private evidence; no public-source, deployment, or production verification is claimed.",
      );
      view.unmount();
    }
  });

  it("renders an Editorial boundary and author-supplied links", () => {
    const editorial: Post = {
      ...publishedPosts[0],
      category: "Editorial",
      project: undefined,
      sourceLinks: [{
        label: "Supporting source",
        href: "https://example.com/source",
      }],
    };

    render(<PostPage post={editorial} />);

    expect(screen.getByText("Author-supplied editorial.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Supporting source" })).toHaveAttribute(
      "href",
      "https://example.com/source",
    );
    expect(screen.getByRole("link", { name: "Links and sources" })).toHaveAttribute(
      "href",
      "#sources",
    );
  });
});
