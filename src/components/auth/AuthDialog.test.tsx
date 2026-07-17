import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";

import { createMockSupabase, mockSession } from "../../test/mockSupabase";
import { AuthDialog } from "./AuthDialog";
import { AuthProvider } from "./AuthProvider";

afterEach(cleanup);

function DialogHarness({ client }: { client: ReturnType<typeof createMockSupabase>["client"] }) {
  const [open, setOpen] = useState(false);

  return (
    <AuthProvider
      client={client}
      callbackUrl="https://cumulus.example/auth/callback"
      unavailableReason={null}
    >
      <button type="button" onClick={() => setOpen(true)}>
        Open notifications
      </button>
      <AuthDialog open={open} onClose={() => setOpen(false)} />
    </AuthProvider>
  );
}

describe("AuthDialog", () => {
  it("requires the pre-send disclosure and sends a normalized magic link", async () => {
    const user = userEvent.setup();
    const { client, mocks } = createMockSupabase();
    render(<DialogHarness client={client} />);

    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());
    await user.click(screen.getByRole("button", { name: "Open notifications" }));
    const email = await screen.findByLabelText("Email address");
    expect(screen.getByRole("link", { name: "notification privacy and data rights" }))
      .toHaveAttribute("href", "/privacy");
    await user.type(email, "  Reader@Example.COM  ");
    await user.click(
      screen.getByRole("checkbox", {
        name: /Show me the final step to turn on email/i,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Send sign-in link" }));

    await waitFor(() => expect(mocks.signInWithOtp).toHaveBeenCalledTimes(1));
    expect(mocks.signInWithOtp).toHaveBeenCalledWith({
      email: "reader@example.com",
      options: {
        shouldCreateUser: true,
        emailRedirectTo: "https://cumulus.example/auth/callback",
      },
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Check your email for a sign-in link",
    );
  });

  it("closes on Escape and returns focus to the opener", async () => {
    const user = userEvent.setup();
    const { client, mocks } = createMockSupabase();
    render(<DialogHarness client={client} />);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());

    const opener = screen.getByRole("button", { name: "Open notifications" });
    await user.click(opener);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it("keeps keyboard focus inside the open dialog", async () => {
    const user = userEvent.setup();
    const { client, mocks } = createMockSupabase();
    render(<DialogHarness client={client} />);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Open notifications" }));
    const email = await screen.findByLabelText("Email address");
    expect(email).toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByRole("link", { name: "notification privacy and data rights" }))
      .toHaveFocus();
    await user.keyboard("{Shift>}{Tab}{/Shift}");
    expect(screen.getByRole("button", { name: "Close notification settings" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("link", { name: "notification privacy and data rights" }))
      .toHaveFocus();
    await user.tab();
    expect(email).toHaveFocus();
  });

  it("does not request a link until the disclosure is acknowledged", async () => {
    const user = userEvent.setup();
    const { client, mocks } = createMockSupabase();
    render(<DialogHarness client={client} />);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Open notifications" }));
    await user.type(await screen.findByLabelText("Email address"), "reader@example.com");
    await user.click(screen.getByRole("button", { name: "Send sign-in link" }));

    expect(mocks.signInWithOtp).not.toHaveBeenCalled();
    expect(
      screen.getByRole("checkbox", {
        name: /Show me the final step to turn on email/i,
      }),
    ).toBeInvalid();
  });

  it("offers global sign-out for a notification session", async () => {
    const user = userEvent.setup();
    const { client, mocks } = createMockSupabase({ session: mockSession });
    render(<DialogHarness client={client} />);
    await waitFor(() => expect(mocks.getSession).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: "Open notifications" }));
    await user.click(await screen.findByRole("button", { name: "Sign out" }));

    await waitFor(() => expect(mocks.signOut).toHaveBeenCalledTimes(1));
  });

  it("shows a setup-unavailable state without constructing auth controls", async () => {
    render(
      <AuthProvider
        client={null}
        callbackUrl={null}
        unavailableReason="Notification setup is unavailable."
      >
        <AuthDialog open onClose={() => undefined} />
      </AuthProvider>,
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Notification setup is unavailable.",
    );
    expect(screen.queryByLabelText("Email address")).not.toBeInTheDocument();
  });
});
