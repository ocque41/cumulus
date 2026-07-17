import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { searchPublishedPosts } from "@/content/posts";

import { LogsPage } from "./LogsPage";

beforeEach(() => {
  window.history.replaceState({}, "", "/logs");
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

describe("LogsPage filters", () => {
  it("applies a category without jumping away from the controls or losing focus", async () => {
    render(<LogsPage />);

    const requisia = screen.getByRole("button", { name: "Requisia" });
    requisia.focus();
    fireEvent.click(requisia);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/^8 entries$/));
    expect(window.location.search).toBe("?category=Requisia");
    expect(requisia).toHaveAttribute("aria-pressed", "true");
    expect(requisia).toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();

    const rows = Array.from(document.querySelectorAll<HTMLElement>(".post-index-row"));
    expect(rows).toHaveLength(8);
    expect(rows.every((row) => row.textContent?.includes("Requisia"))).toBe(true);
  });

  it("combines the search draft with a category and clears both filters", async () => {
    render(<LogsPage />);

    const query = "evidence";
    const expected = searchPublishedPosts(query, "Requisia").length;
    fireEvent.change(screen.getByRole("searchbox", { name: "Search logs" }), {
      target: { value: query },
    });
    fireEvent.click(screen.getByRole("button", { name: "Requisia" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(
      `${expected} entries matching “${query}”`,
    ));
    expect(window.location.search).toBe("?q=evidence&category=Requisia");

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/^20 entries$/));
    expect(window.location.pathname).toBe("/logs");
    expect(window.location.search).toBe("");
    expect(screen.getByRole("searchbox", { name: "Search logs" })).toHaveValue("");
  });

  it("synchronizes the search draft when browser history changes", async () => {
    render(<LogsPage />);

    window.history.pushState({}, "", "/logs?q=security");
    window.dispatchEvent(new Event("popstate"));

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search logs" })).toHaveValue("security");
      expect(screen.getByRole("status")).toHaveTextContent(/matching “security”/);
    });
  });
});
