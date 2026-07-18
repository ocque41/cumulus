import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AuthContext,
  type AuthContextValue,
} from "../../components/auth/AuthContext";
import { NotificationPreferences } from "./NotificationPreferences";

const authenticatedContext: AuthContextValue = {
  available: true,
  exchangeMagicLink: vi.fn(),
  loading: false,
  refreshSession: vi.fn(),
  requestMagicLink: vi.fn(),
  signOut: vi.fn(),
  unavailableReason: null,
  user: { email: "reader@example.com" },
};

afterEach(cleanup);

describe("NotificationPreferences", () => {
  it("makes unsubscribe explicit and supports a later deliberate reactivation", async () => {
    let status: "active" | "unsubscribed" = "active";
    const onStatusChange = vi.fn();
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === "PUT") {
        status = JSON.parse(String(init.body)).status as typeof status;
      }
      return new Response(JSON.stringify({ ok: true, status }));
    }) as unknown as typeof fetch;

    render(
      <AuthContext.Provider value={authenticatedContext}>
        <NotificationPreferences
          fetcher={fetcher}
          onStatusChange={onStatusChange}
        />
      </AuthContext.Provider>,
    );

    const unsubscribe = await screen.findByRole("button", {
      name: "Unsubscribe from new-post emails",
    });
    expect(screen.getByText("New-post notifications are on")).toBeVisible();
    fireEvent.click(unsubscribe);

    await waitFor(() => {
      expect(screen.getByText("New-post notifications are off")).toBeVisible();
    });
    expect(onStatusChange).toHaveBeenLastCalledWith("unsubscribed");
    expect(fetcher).toHaveBeenLastCalledWith(
      "/api/notifications/preferences",
      expect.objectContaining({
        body: JSON.stringify({ status: "unsubscribed" }),
        method: "PUT",
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Turn on notifications" }));
    await waitFor(() => {
      expect(screen.getByText("New-post notifications are on")).toBeVisible();
    });
    expect(onStatusChange).toHaveBeenLastCalledWith("active");
  });

  it("reports an unknown preference accurately and recovers through retry", async () => {
    const fetcherMock = vi.fn()
      .mockRejectedValueOnce(new Error("temporary outage"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, status: "active" })),
      );
    const fetcher = fetcherMock as unknown as typeof fetch;

    render(
      <AuthContext.Provider value={authenticatedContext}>
        <NotificationPreferences fetcher={fetcher} />
      </AuthContext.Provider>,
    );

    expect(await screen.findByText(/could not load this notification preference/i))
      .toBeVisible();
    expect(screen.getByText("Current preference unavailable")).toBeVisible();
    expect(screen.queryByText("No notification preference is saved"))
      .not.toBeInTheDocument();
    const retry = screen.getByRole("button", { name: "Retry preference" });
    expect(retry).toBeEnabled();
    expect(fetcherMock).toHaveBeenCalledTimes(1);

    fireEvent.click(retry);

    expect(await screen.findByText("New-post notifications are on")).toBeVisible();
    expect(screen.getByRole("button", {
      name: "Unsubscribe from new-post emails",
    })).toBeEnabled();
    expect(fetcherMock).toHaveBeenCalledTimes(2);
    expect(fetcherMock.mock.calls.every(([, init]) => init?.method !== "PUT"))
      .toBe(true);
  });
});
