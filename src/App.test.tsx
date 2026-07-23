import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NOTIFICATION_PROMPT_STORAGE_KEY } from "@/features/notifications/prompt-storage";

const authState = vi.hoisted(() => ({
  available: true,
  loading: false,
  user: null as { email: string } | null,
}));

vi.mock("@/components/auth", () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => authState,
  AuthCallbackPage: () => <main>Notification callback</main>,
  AuthDialog: ({
    mode,
    onClose,
    open,
  }: {
    mode: "automatic" | "manual";
    onClose: () => void;
    open: boolean;
  }) => open ? (
    <section
      aria-label="Notification prompt"
      data-marker-at-render={
        window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY) ?? "unset"
      }
      data-mode={mode}
      role="dialog"
    >
      <button onClick={onClose} type="button">Close prompt</button>
    </section>
  ) : null,
}));

vi.mock("@/components/layout/SiteLayout", () => ({
  SiteLayout: ({
    children,
    onOpenAuth,
  }: {
    children: ReactNode;
    onOpenAuth: () => void;
  }) => (
    <div className="site-frame">
      <button onClick={onOpenAuth} type="button">Open notification settings</button>
      <main id="main-content">{children}</main>
    </div>
  ),
}));

vi.mock("@/content/posts", () => ({
  getPublishedPostBySlug: () => undefined,
  publishedPosts: Array.from({ length: 21 }, (_, index) => ({
    category: "Editorial",
    slug: `post-${index + 1}`,
  })),
}));

vi.mock("@/pages/HomePage", () => ({ HomePage: () => <p>Home</p> }));
vi.mock("@/pages/AreasPage", () => ({
  AreaArchivePage: () => <p>Area archive</p>,
  AreasPage: () => <p>Areas</p>,
}));
vi.mock("@/pages/LogsPage", () => ({ LogsPage: () => <p>Logs</p> }));
vi.mock("@/pages/NotFoundPage", () => ({ NotFoundPage: () => <p>Not found</p> }));
vi.mock("@/pages/PostPage", () => ({ PostPage: () => <p>Post</p> }));
vi.mock("@/pages/PrivacyPage", () => ({ PrivacyPage: () => <p>Privacy</p> }));
vi.mock("@/pages/WorkPage", () => ({ WorkPage: () => <p>Work</p> }));

import { App } from "./App";

beforeEach(() => {
  authState.available = true;
  authState.loading = false;
  authState.user = null;
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe("first-visit notification prompt", () => {
  it("opens once for an eligible anonymous browser and preserves manual reopening", async () => {
    const first = render(<App />);

    const invitation = await screen.findByRole("dialog", {
      name: "Notification prompt",
    });
    expect(invitation).toHaveAttribute("data-mode", "automatic");
    expect(invitation).toHaveAttribute("data-marker-at-render", "unset");
    await waitFor(() => {
      expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBe("1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Close prompt" }));
    first.unmount();
    render(<App />);
    await act(async () => Promise.resolve());
    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open notification settings" }));
    expect(screen.getByRole("dialog", { name: "Notification prompt" }))
      .toHaveAttribute("data-mode", "manual");
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBe("1");
  });

  it("does not auto-open while unavailable but marks a displayed manual surface", async () => {
    authState.available = false;
    render(<App />);

    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Open notification settings" }));
    const settings = screen.getByRole("dialog", { name: "Notification prompt" });
    expect(settings).toHaveAttribute("data-mode", "manual");
    expect(settings).toHaveAttribute("data-marker-at-render", "unset");
    await waitFor(() => {
      expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBe("1");
    });
  });

  it("suppresses the automatic prompt for an existing notification session", () => {
    authState.user = { email: "reader@example.com" };
    render(<App />);

    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBeNull();
  });

  it("waits until leaving the privacy page for an eligible public route", async () => {
    window.history.replaceState({}, "", "/privacy");
    render(<App />);

    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBeNull();

    act(() => {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new Event("popstate"));
    });

    expect(await screen.findByRole("dialog", { name: "Notification prompt" }))
      .toHaveAttribute("data-mode", "automatic");
  });

  it("never opens over the notification callback or an unknown route", () => {
    window.history.replaceState({}, "", "/auth/callback#token=safe-token");
    const callback = render(<App />);
    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBeNull();

    callback.unmount();
    window.history.replaceState({}, "", "/unknown");
    render(<App />);
    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBeNull();
  });

  it.each([
    ["privacy", "/privacy"],
    ["notification callback", "/auth/callback#token=safe-token"],
    ["not-found", "/unknown"],
  ])("closes an automatic invitation on %s navigation and keeps it closed on return", async (
    _destination,
    destination,
  ) => {
    render(<App />);
    expect(await screen.findByRole("dialog", { name: "Notification prompt" }))
      .toHaveAttribute("data-mode", "automatic");

    act(() => {
      window.history.pushState({}, "", destination);
      window.dispatchEvent(new Event("popstate"));
    });
    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
    await act(async () => Promise.resolve());

    act(() => {
      window.history.pushState({}, "", "/");
      window.dispatchEvent(new Event("popstate"));
    });
    expect(screen.queryByRole("dialog", { name: "Notification prompt" }))
      .not.toBeInTheDocument();
  });
});
