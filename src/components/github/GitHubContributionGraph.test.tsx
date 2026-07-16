import { readFileSync } from "node:fs";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GitHubContributionGraph } from "./GitHubContributionGraph";

const STYLES = readFileSync("src/styles.css", "utf8");

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
            { count: 3, date: "2025-07-13", level: 2 },
          ],
          totalContributions: 37,
          fetchedAt: "2026-07-16T10:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetcher);

    render(<GitHubContributionGraph />);
    expect(
      document.querySelector('.contribution-frame[data-load-state="loading"]'),
    ).toHaveAttribute("data-texture", "dither");

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
    const graphCells = document.querySelectorAll(
      ".contribution-grid .contribution-cell",
    );
    expect(graphCells).toHaveLength(371);
    expect(
      document.querySelectorAll(
        '.contribution-grid .contribution-cell[data-texture="dither"]',
      ),
    ).toHaveLength(371);
    const dither = document.querySelector<HTMLElement>(
      ".contribution-frame [data-slot='hero-dither']",
    );
    expect(dither).not.toBeNull();
    expect(dither?.style.maskImage).toContain("radial-gradient");
    expect(
      document.querySelector('.contribution-frame[data-texture="dither"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('.contribution-legend[data-texture="dither"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('.contribution-status[data-texture="dither"]'),
    ).not.toBeNull();
    expect(STYLES).toMatch(
      /\.contribution-cell\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-frame\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-status\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
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
    expect(
      document.querySelector('.contribution-frame[data-load-state="fallback"]'),
    ).toHaveAttribute("data-texture", "dither");
    expect(
      document.querySelectorAll(
        '.contribution-grid .contribution-cell[data-texture="dither"]',
      ),
    ).toHaveLength(371);
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

  it("anchors all 53 weeks to the earliest observed GitHub week", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            username: "ocque41",
            contributions: [
              { count: 0, date: "2025-07-13", level: 0 },
              { count: 49, date: "2026-07-16", level: 2 },
            ],
            totalContributions: 4_139,
            fetchedAt: "2026-07-16T15:14:08.132Z",
          }),
          { status: 200 },
        ),
      ),
    );

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(
        screen.getByText("4139 contributions in the reported calendar."),
      ).toBeInTheDocument(),
    );
    const cells = document.querySelectorAll<HTMLElement>(
      ".contribution-grid .contribution-cell",
    );
    expect(cells).toHaveLength(371);
    expect(cells[0]).toHaveAttribute("title", "2025-07-13: 0 contributions");
    expect(cells[368]).toHaveAttribute(
      "title",
      "2026-07-16: 49 contributions",
    );
    expect(cells[370]).toHaveAttribute(
      "title",
      "2026-07-18: contribution data unavailable",
    );
  });
});
