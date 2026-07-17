import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthContext, type AuthContextValue } from "./AuthContext";
import { AuthDialog } from "./AuthDialog";

function authValue(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return {
    available: true,
    exchangeMagicLink: vi.fn(),
    loading: false,
    refreshSession: vi.fn().mockResolvedValue(undefined),
    requestMagicLink: vi.fn().mockResolvedValue({
      ok: true,
      message: "Confirmation sent.",
    }),
    signOut: vi.fn().mockResolvedValue({ ok: true, message: "Email forgotten." }),
    unavailableReason: null,
    user: null,
    ...overrides,
  };
}

function DialogHarness({
  initialOpen = true,
  mode = "manual",
  value = authValue(),
}: {
  initialOpen?: boolean;
  mode?: "automatic" | "manual";
  value?: AuthContextValue;
}) {
  const [open, setOpen] = useState(initialOpen);

  return (
    <AuthContext.Provider value={value}>
      <div className="site-frame">
        <button onClick={() => setOpen(true)} type="button">
          Manual notification trigger
        </button>
        <main id="main-content">Public logs</main>
      </div>
      <AuthDialog mode={mode} open={open} onClose={() => setOpen(false)} />
    </AuthContext.Provider>
  );
}

function SignedInDialogHarness() {
  const [user, setUser] = useState<{ email: string } | null>({
    email: "reader@example.com",
  });
  const value = authValue({
    user,
    signOut: vi.fn(async () => {
      setUser(null);
      return { ok: true, message: "Email forgotten." };
    }),
  });

  return (
    <AuthContext.Provider value={value}>
      <div className="site-frame">
        <main id="main-content">Public logs</main>
      </div>
      <AuthDialog open onClose={() => undefined} />
    </AuthContext.Provider>
  );
}

function UnavailableDialogHarness() {
  const [available, setAvailable] = useState(false);
  const value = authValue({
    available,
    unavailableReason: available ? null : "Temporary notification outage.",
    refreshSession: vi.fn(async () => setAvailable(true)),
  });

  return (
    <AuthContext.Provider value={value}>
      <div className="site-frame">
        <main id="main-content">Public logs</main>
      </div>
      <AuthDialog open onClose={() => undefined} />
    </AuthContext.Provider>
  );
}

beforeEach(() => {
  window.history.replaceState({}, "", "/");
  document.body.style.overflow = "";
  vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
  window.history.replaceState({}, "", "/");
});

describe("AuthDialog", () => {
  it("isolates the page and gives an automatic invitation a quiet first focus", () => {
    expect(document.body).toHaveFocus();
    render(<DialogHarness mode="automatic" />);

    const title = screen.getByRole("heading", { name: "New log notifications" });
    expect(title).toHaveFocus();
    expect(screen.getByText("Public logs").closest(".site-frame"))
      .toHaveAttribute("inert");
    expect(screen.getByText("Public logs").closest(".site-frame"))
      .toHaveAttribute("aria-hidden", "true");
    expect(document.body.style.overflow).toBe("hidden");
    expect(screen.getByRole("button", { name: "Not now" })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Public logs").closest(".site-frame"))
      .not.toHaveAttribute("inert");
    expect(screen.getByText("Public logs").closest(".site-frame"))
      .not.toHaveAttribute("aria-hidden");
    expect(document.body.style.overflow).toBe("");
    expect(screen.getByText("Public logs")).toHaveFocus();
    expect(screen.getByText("Public logs")).toHaveAttribute("tabindex", "-1");

    screen.getByRole("button", { name: "Manual notification trigger" }).focus();
    expect(screen.getByText("Public logs")).not.toHaveAttribute("tabindex");
  });

  it("returns an automatic invitation to its actual connected opener", () => {
    render(<DialogHarness initialOpen={false} mode="automatic" />);
    const trigger = screen.getByRole("button", {
      name: "Manual notification trigger",
    });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole("heading", { name: "New log notifications" }))
      .toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(trigger).toHaveFocus();
  });

  it("returns manual focus and resets email and disclosure state before reopening", () => {
    render(<DialogHarness initialOpen={false} />);
    const trigger = screen.getByRole("button", { name: "Manual notification trigger" });
    trigger.focus();
    fireEvent.click(trigger);

    const email = screen.getByRole("textbox", { name: "Email address" });
    const disclosure = screen.getByRole("checkbox");
    expect(email).toHaveFocus();
    fireEvent.change(email, { target: { value: "reader@example.com" } });
    fireEvent.click(disclosure);
    expect(disclosure).toBeChecked();

    fireEvent.click(screen.getByRole("button", { name: "Close notification settings" }));
    expect(trigger).toHaveFocus();
    fireEvent.click(trigger);

    expect(screen.getByRole("textbox", { name: "Email address" })).toHaveValue("");
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("closes the modal before opening notification privacy", () => {
    render(<DialogHarness initialOpen={false} />);
    const trigger = screen.getByRole("button", {
      name: "Manual notification trigger",
    });
    trigger.focus();
    fireEvent.click(trigger);

    fireEvent.click(screen.getByRole("link", {
      name: "notification privacy and data rights",
    }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(window.location.pathname).toBe("/privacy");
    expect(screen.getByText("Public logs")).toHaveFocus();
    expect(screen.getByText("Public logs")).toHaveAttribute("tabindex", "-1");
    expect(trigger).not.toHaveFocus();
  });

  it("keeps forward and reverse tabbing inside the dialog", () => {
    render(<DialogHarness mode="automatic" />);
    const close = screen.getByRole("button", { name: "Close notification settings" });
    const notNow = screen.getByRole("button", { name: "Not now" });

    notNow.focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(notNow).toHaveFocus();
  });

  it("contains programmatic focus attempts from outside the dialog", () => {
    render(<DialogHarness />);
    const email = screen.getByRole("textbox", { name: "Email address" });
    const outside = screen.getByText("Manual notification trigger")
      .closest("button");
    expect(outside).not.toBeNull();
    expect(email).toHaveFocus();

    outside?.focus();

    expect(email).toHaveFocus();
  });

  it("moves focus to the email control after successful session retry", async () => {
    render(<UnavailableDialogHarness />);
    const retry = screen.getByRole("button", { name: "Retry" });
    expect(retry).toBeVisible();

    fireEvent.click(retry);

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Email address" }))
        .toHaveFocus();
    });
  });

  it("moves focus to the replacement email control after forgetting a session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      status: "active",
    }))));
    render(<SignedInDialogHarness />);

    fireEvent.click(screen.getByRole("button", {
      name: "Forget this email on this browser",
    }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: "Email address" }))
        .toHaveFocus();
    });
  });

  it("uses notification language and keeps the disclosure unchecked", () => {
    render(<DialogHarness />);

    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Send confirmation link" }))
      .toBeVisible();
    expect(screen.queryByText(/sign in|sign out/i)).not.toBeInTheDocument();
  });
});
