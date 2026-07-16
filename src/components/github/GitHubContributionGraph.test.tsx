import { readFileSync } from "node:fs";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
          activityDays: [
            {
              commits: 3,
              date: "2025-07-13",
              highlights: [
                {
                  kind: "commit",
                  repository: "cumulus/cloud",
                  title: "3 commits",
                },
                {
                  kind: "pull-request",
                  repository: "cumulus/cloud",
                  title: "Fix the activity field",
                  url: "https://github.com/cumulus/cloud/pull/12",
                },
              ],
              issues: 1,
              pullRequests: 1,
            },
          ],
          activityDetailStatus: "live",
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
    expect(screen.getByRole("group")).toHaveAccessibleName(
      /37 GitHub contributions across 1 active day in the reported calendar/i,
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
      document.querySelector('.contribution-surface[data-texture="dither"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('.contribution-grid[data-texture="dither"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('.contribution-meta[data-texture="dither"]'),
    ).not.toBeNull();
    expect(STYLES).toMatch(
      /\.contribution-cell\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-frame\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-meta\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-surface\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-grid\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-grid\s*\{[\s\S]*?mask-image:\s*linear-gradient/,
    );
    expect(STYLES).toMatch(
      /\.contribution-legend\s*\{[\s\S]*?background-image:\s*radial-gradient/,
    );
    expect(
      screen.getByLabelText("Contribution density from quiet to active"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Public activity")).not.toBeInTheDocument();

    const activeCell = document.querySelector<HTMLButtonElement>('button[data-index="0"]');
    expect(activeCell).toHaveAccessibleName(
      /Sunday, July 13, 2025: 3 contributions; 3 commits, 1 pull request, 1 issue/i,
    );
    if (!activeCell) throw new Error("Expected the first contribution cell");
    fireEvent.pointerEnter(activeCell);
    expect(screen.getByText("Fix the activity field")).toHaveAttribute(
      "href",
      "https://github.com/cumulus/cloud/pull/12",
    );
    expect(screen.getByRole("heading", { name: "Sunday, July 13, 2025" })).toBeVisible();
    expect(screen.getAllByText("cloud")).toHaveLength(2);
    expect(screen.queryByText("cumulus/cloud")).not.toBeInTheDocument();

    fireEvent.click(activeCell);
    expect(screen.getByRole("button", { name: "Close activity details" })).toBeVisible();
    fireEvent.click(activeCell);
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();

    const frame = document.querySelector<HTMLElement>(".contribution-frame");
    expect(frame).not.toBeNull();
    if (!frame) throw new Error("Expected the contribution frame");
    vi.spyOn(frame, "getBoundingClientRect").mockReturnValue({
      bottom: 240,
      height: 240,
      left: 0,
      right: 1_000,
      top: 0,
      width: 1_000,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    fireEvent.pointerEnter(activeCell);
    const popover = document.querySelector<HTMLElement>(".contribution-popover");
    if (!popover) throw new Error("Expected the activity popover");
    Object.defineProperty(popover, "offsetWidth", { configurable: true, value: 384 });

    fireEvent.pointerMove(frame as HTMLElement, {
      clientX: 900,
      clientY: 100,
      pointerType: "mouse",
    });
    await waitFor(() => expect(frame).toHaveAttribute("data-popover-side", "left"));
    expect(frame?.style.getPropertyValue("--graph-rotate-y")).not.toBe("0deg");
    expect(Number.parseFloat(frame.style.getPropertyValue("--popover-left"))).toBeLessThan(900);

    fireEvent.pointerMove(frame, {
      clientX: 100,
      clientY: 100,
      pointerType: "mouse",
    });
    await waitFor(() => expect(frame).toHaveAttribute("data-popover-side", "right"));
    expect(Number.parseFloat(frame.style.getPropertyValue("--popover-left"))).toBeGreaterThan(100);

    fireEvent.focus(activeCell);
    fireEvent.keyDown(activeCell, { key: "ArrowRight" });
    expect(document.activeElement).toBe(
      document.querySelector('button[data-index="7"]'),
    );
  }, 10_000);

  it("renders an honest no-data graph when the server boundary fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(
        screen.getByText(/empty grid contains no inferred counts/i),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("group")).toHaveAccessibleName(
      /GitHub contribution graph is currently unavailable/i,
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
    expect(screen.getByRole("link", { name: /^GitHub/i })).toHaveAttribute(
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
    expect(cells[0]).toHaveAttribute("title", expect.stringContaining("Sunday, July 13, 2025: 0 contributions"));
    expect(cells[368]).toHaveAttribute(
      "title",
      expect.stringContaining("Thursday, July 16, 2026: 49 contributions"),
    );
    expect(cells[370]).toHaveAttribute(
      "title",
      expect.stringContaining("Saturday, July 18, 2026: contribution count unavailable"),
    );
  });
});
