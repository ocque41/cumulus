import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GitHubContributionGraph } from "./GitHubContributionGraph";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("GitHubContributionGraph", () => {
  it("uses the same-origin contribution boundary and announces validated data", async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          username: "ocque41",
          contributions: [
            { count: 3, date: new Date().toISOString().slice(0, 10), level: 2 },
          ],
          totalContributions: 37,
          fetchedAt: "2026-07-16T10:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetcher);

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(screen.getByText("37 contributions in the reported calendar.")).toBeInTheDocument(),
    );
    expect(fetcher).toHaveBeenCalledWith(
      "/api/github/contributions",
      expect.objectContaining({ cache: "no-store", credentials: "same-origin" }),
    );
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /37 GitHub contributions across 1 active day for ocque41/i,
    );
    expect(document.querySelectorAll(".contribution-grid .contribution-cell")).toHaveLength(364);
    expect(document.querySelector(".contribution-frame [data-slot='hero-dither']")).not.toBeNull();
    expect(
      screen.getByLabelText("Contribution density from quiet to active"),
    ).toBeInTheDocument();
  });

  it("renders an honest no-data graph when the server boundary fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(
        screen.getByText(/empty grid contains no inferred counts/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("img")).toHaveAccessibleName(
      /contribution graph for ocque41 is currently unavailable/i,
    );
    expect(document.querySelector("[data-known='true']")).toBeNull();
    expect(document.querySelector(".contribution-dither")).not.toBeNull();
    expect(screen.getByRole("link", { name: /complete GitHub profile/i })).toHaveAttribute(
      "href",
      "https://github.com/ocque41",
    );
  });

  it("rejects malformed or cross-user payloads instead of displaying them", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            username: "someone-else",
            contributions: [{ count: 99, date: "2026-07-16", level: 4 }],
            totalContributions: 99,
            fetchedAt: "2026-07-16T10:00:00.000Z",
          }),
          { status: 200 },
        ),
      ),
    );

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(
        screen.getByText(/empty grid contains no inferred counts/i),
      ).toBeInTheDocument(),
    );
    expect(document.querySelector("[data-known='true']")).toBeNull();
  });
});
