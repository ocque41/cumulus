import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createMockSupabase, mockUser } from "../../test/mockSupabase";
import { AuthCallbackPage } from "./AuthCallbackPage";
import { AuthProvider } from "./AuthProvider";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("AuthCallbackPage", () => {
  it("exchanges a PKCE code but waits for deliberate consent before activation", async () => {
    const user = userEvent.setup();
    window.history.replaceState(
      {},
      "",
      "/auth/callback?code=one-time-code&next=https://evil.example",
    );
    const onComplete = vi.fn();
    const { client, mocks } = createMockSupabase();

    render(
      <AuthProvider
        client={client}
        callbackUrl="https://cumulus.example/auth/callback"
        unavailableReason={null}
      >
        <AuthCallbackPage onComplete={onComplete} />
      </AuthProvider>,
    );

    expect(window.location.pathname).toBe("/auth/callback");
    expect(window.location.search).toBe("");
    expect(
      await screen.findByRole("heading", { name: "Email confirmed" }),
    ).toBeInTheDocument();
    expect(mocks.exchangeCodeForSession).toHaveBeenCalledWith("one-time-code");
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Notifications are still off",
    );
    await user.click(
      screen.getByRole("button", {
        name: "Turn on new-post notifications",
      }),
    );

    expect(
      await screen.findByRole("heading", { name: "Notifications confirmed" }),
    ).toBeInTheDocument();
    expect(mocks.upsert).toHaveBeenCalledWith(
      { user_id: mockUser.id, status: "active" },
      { onConflict: "user_id", ignoreDuplicates: false },
    );
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("rejects an incomplete callback without changing a preference", async () => {
    window.history.replaceState({}, "", "/auth/callback?next=/private");
    const { client, mocks } = createMockSupabase();

    render(
      <AuthProvider
        client={client}
        callbackUrl="https://cumulus.example/auth/callback"
        unavailableReason={null}
      >
        <AuthCallbackPage />
      </AuthProvider>,
    );

    expect(
      await screen.findByText(/sign-in link is incomplete/i),
    ).toBeInTheDocument();
    await waitFor(() => expect(mocks.exchangeCodeForSession).not.toHaveBeenCalled());
    expect(mocks.upsert).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
  });
});
