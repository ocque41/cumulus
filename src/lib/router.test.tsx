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

  it("preserves scroll position for in-place filter navigation", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    window.history.replaceState({}, "", "/logs");

    navigate("/logs?q=security", { scroll: false });

    expect(window.location.search).toBe("?q=security");
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves same-document hash links to native browser navigation", () => {
    window.history.replaceState({}, "", "/work");
    const navigated = vi.fn();
    const preventJsdomNavigation = (event: Event) => event.preventDefault();
    window.addEventListener("cumulus:navigate", navigated);
    window.addEventListener("click", preventJsdomNavigation);
    render(<AppLink href="#work-cumulus">Cumulus project</AppLink>);

    const link = screen.getByRole("link", { name: "Cumulus project" });
    fireEvent.click(link);

    expect(navigated).not.toHaveBeenCalled();
    window.removeEventListener("cumulus:navigate", navigated);
    window.removeEventListener("click", preventJsdomNavigation);
  });
});
