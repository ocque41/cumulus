import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { PrivacyPage } from "./PrivacyPage";

afterEach(cleanup);

describe("PrivacyPage", () => {
  it("states the narrow notification data boundary and reader controls", () => {
    render(<PrivacyPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Notification privacy" }))
      .toBeInTheDocument();
    expect(screen.getByText(/Unsubscribing stops future Cumulus log email/i))
      .toBeInTheDocument();
    expect(screen.getByText(/does not promise an automatic expiry/i))
      .toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "hi@cumulush.com" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Return to the public logs" }))
      .toHaveAttribute("href", "/logs");
  });
});
