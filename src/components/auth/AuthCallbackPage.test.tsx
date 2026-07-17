import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NOTIFICATION_PROMPT_STORAGE_KEY } from "../../features/notifications/prompt-storage";
import { AuthContext, type AuthContextValue } from "./AuthContext";
import { AuthCallbackPage } from "./AuthCallbackPage";

function authValue(exchangeMagicLink: AuthContextValue["exchangeMagicLink"]): AuthContextValue {
  return {
    available: true,
    exchangeMagicLink,
    loading: false,
    refreshSession: vi.fn().mockResolvedValue(undefined),
    requestMagicLink: vi.fn(),
    signOut: vi.fn(),
    unavailableReason: null,
    user: null,
  };
}

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/auth/callback#token=strict-token");
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "/");
});

describe("AuthCallbackPage", () => {
  it("keeps a fragment token through StrictMode and waits for explicit activation", async () => {
    const exchangeMagicLink = vi.fn().mockResolvedValue({
      ok: true,
      message: "Email confirmed.",
    });
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      ok: true,
      status: "active",
    }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    }));
    const onComplete = vi.fn();

    render(
      <StrictMode>
        <AuthContext.Provider value={authValue(exchangeMagicLink)}>
          <AuthCallbackPage fetcher={fetcher} onComplete={onComplete} />
        </AuthContext.Provider>
      </StrictMode>,
    );

    await screen.findByRole("heading", { name: "Email confirmed" });
    expect(exchangeMagicLink).toHaveBeenCalledTimes(1);
    expect(exchangeMagicLink).toHaveBeenCalledWith("strict-token");
    expect(window.location.hash).toBe("");
    expect(fetcher).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBeNull();

    fireEvent.click(screen.getByRole("button", {
      name: "Turn on new-log notifications",
    }));

    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(1));
    expect(fetcher).toHaveBeenCalledWith(
      "/api/notifications/preferences",
      expect.objectContaining({
        body: JSON.stringify({ status: "active" }),
        method: "PUT",
      }),
    );
    expect(window.localStorage.getItem(NOTIFICATION_PROMPT_STORAGE_KEY)).toBe("1");
  });
});
