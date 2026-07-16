import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthProvider } from "../../components/auth/AuthProvider";
import {
  createMockSupabase,
  mockSession,
  mockUser,
} from "../../test/mockSupabase";
import { NotificationPreferences } from "./NotificationPreferences";

afterEach(cleanup);

describe("NotificationPreferences", () => {
  it("renders the pending state and explicitly confirms it", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    const { client, mocks } = createMockSupabase({
      session: mockSession,
      readStatus: "pending",
    });

    render(
      <AuthProvider
        client={client}
        callbackUrl="https://cumulus.example/auth/callback"
        unavailableReason={null}
      >
        <NotificationPreferences onStatusChange={onStatusChange} />
      </AuthProvider>,
    );

    expect(await screen.findByText("Pending confirmation")).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: "Confirm notifications" }),
    );

    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith(
        { user_id: mockUser.id, status: "active" },
        { onConflict: "user_id", ignoreDuplicates: false },
      ),
    );
    expect(onStatusChange).toHaveBeenCalledWith("active");
    expect(screen.getByText("New-post notifications are on")).toBeInTheDocument();
  });

  it("turns an active preference off without writing lifecycle timestamps", async () => {
    const user = userEvent.setup();
    const { client, mocks } = createMockSupabase({
      session: mockSession,
      readStatus: "active",
    });

    render(
      <AuthProvider
        client={client}
        callbackUrl="https://cumulus.example/auth/callback"
        unavailableReason={null}
      >
        <NotificationPreferences />
      </AuthProvider>,
    );

    await user.click(
      await screen.findByRole("button", { name: "Turn off notifications" }),
    );
    await waitFor(() =>
      expect(mocks.upsert).toHaveBeenCalledWith(
        { user_id: mockUser.id, status: "unsubscribed" },
        { onConflict: "user_id", ignoreDuplicates: false },
      ),
    );
    const browserWrite = mocks.upsert.mock.calls.at(-1)?.[0];
    expect(browserWrite).toEqual({
      user_id: mockUser.id,
      status: "unsubscribed",
    });
    expect(browserWrite).not.toHaveProperty("confirmed_at");
    expect(browserWrite).not.toHaveProperty("unsubscribed_at");
  });
});
