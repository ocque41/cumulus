import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppLink, navigate } from "./router";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
  vi.restoreAllMocks();
});

describe("client navigation", () => {
  it("keeps internal links as real anchors while navigating without a reload", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    render(<AppLink href="/logs?q=scope">Browse logs</AppLink>);

    const link = screen.getByRole("link", { name: "Browse logs" });
    expect(link).toHaveAttribute("href", "/logs?q=scope");
    fireEvent.click(link);
    expect(window.location.pathname).toBe("/logs");
    expect(window.location.search).toBe("?q=scope");
  });

  it("supports replace navigation for sensitive callback cleanup", () => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.history.pushState({}, "", "/auth/callback?code=secret");
    navigate("/", { replace: true });
    expect(window.location.pathname).toBe("/");
    expect(window.location.search).toBe("");
  });
});
