import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UnsubscribePage } from "./UnsubscribePage";

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

describe("UnsubscribePage", () => {
  it("captures a legacy query token immediately but waits for deliberate POST", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    window.history.replaceState({}, "", "/unsubscribe?token=signed-token");

    render(<UnsubscribePage fetcher={fetcher} />);

    expect(fetcher).not.toHaveBeenCalled();
    expect(window.location.search).toBe("");
    await user.click(
      screen.getByRole("button", { name: "Turn notifications off" }),
    );

    expect(
      await screen.findByRole("heading", { name: "Notifications are off" }),
    ).toBeInTheDocument();
    expect(fetcher).toHaveBeenCalledWith("/api/notifications/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "signed-token" }),
    });
  });

  it("prefers a fragment token and removes both URL token forms immediately", async () => {
    const user = userEvent.setup();
    const fetcher = vi.fn(async () => new Response(null, { status: 204 }));
    window.history.replaceState(
      {},
      "",
      "/unsubscribe?token=legacy-token#token=fragment-token",
    );

    render(<UnsubscribePage fetcher={fetcher} />);

    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("");
    expect(fetcher).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Turn notifications off" }),
    );
    await screen.findByRole("heading", { name: "Notifications are off" });

    expect(fetcher).toHaveBeenCalledWith("/api/notifications/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: "fragment-token" }),
    });
  });

  it("does not send a request when the URL has no token", () => {
    const fetcher = vi.fn();
    window.history.replaceState({}, "", "/unsubscribe");

    render(<UnsubscribePage fetcher={fetcher} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "unsubscribe link is incomplete or invalid",
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
});
