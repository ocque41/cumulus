import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { publishedPosts } from "@/content/posts";

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
    for (const post of publishedPosts) {
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
});
