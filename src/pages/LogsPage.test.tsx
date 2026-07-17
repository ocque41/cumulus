import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { publishedPosts } from "../content/posts";
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

    const rune = screen.getByRole("button", { name: "Rune" });
    rune.focus();
    fireEvent.click(rune);

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/^4 entries$/));
    expect(window.location.search).toBe("?category=Rune");
    expect(rune).toHaveAttribute("aria-pressed", "true");
    expect(rune).toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalled();

    const rows = Array.from(document.querySelectorAll<HTMLElement>(".post-index-row"));
    expect(rows).toHaveLength(4);
    expect(rows.every((row) => row.textContent?.includes("Rune"))).toBe(true);
  });

  it("combines the search draft with a category and clears both filters", async () => {
    render(<LogsPage />);

    fireEvent.change(screen.getByRole("searchbox", { name: "Search logs" }), {
      target: { value: "secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Rune" }));

    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(/^2 entries matching “secret”$/));
    expect(window.location.search).toBe("?q=secret&category=Rune");

    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(
      `${publishedPosts.length} entries`,
    ));
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
