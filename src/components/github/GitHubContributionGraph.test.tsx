import { readFileSync } from "node:fs";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GitHubContributionGraph } from "./GitHubContributionGraph";

const STYLES = readFileSync("src/styles.css", "utf8");

const LIVE_PAYLOAD = {
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
};

const DENSE_HIGHLIGHT_PAYLOAD = {
  ...LIVE_PAYLOAD,
  activityDays: [
    {
      ...LIVE_PAYLOAD.activityDays[0],
      highlights: [
        ...LIVE_PAYLOAD.activityDays[0].highlights,
        {
          kind: "issue",
          repository: "cumulus/cloud",
          title: "Document keyboard focus",
        },
        {
          kind: "commit",
          repository: "cumulus/cloud",
          title: "Refine responsive graph",
        },
        {
          kind: "pull-request",
          repository: "cumulus/cloud",
          title: "Keep page scroll native",
        },
      ],
    },
  ],
};

function liveResponse(payload: unknown = LIVE_PAYLOAD) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function stubPickerMedia(matches: boolean) {
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    addEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matches: query.includes("pointer: coarse") ? matches : false,
    media: query,
    onchange: null,
    removeEventListener: vi.fn(),
  })));
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// This DOM-heavy suite renders 371 interactive cells per case. Give it a
// focused budget that remains stable when Vitest runs every UI suite in
// parallel on a busy development machine.
describe("GitHubContributionGraph", { timeout: 15_000 }, () => {
  it("uses the same-origin contribution boundary and announces validated data", async () => {
    const fetcher = vi.fn().mockResolvedValue(liveResponse());
    vi.stubGlobal("fetch", fetcher);

    render(<GitHubContributionGraph />);
    const grid = document.querySelector<HTMLElement>(".contribution-grid");
    if (!grid) throw new Error("Expected the contribution grid");
    expect(
      document.querySelector('.contribution-frame[data-load-state="loading"]'),
    ).toHaveAttribute("data-texture", "dither");
    expect(grid).toHaveAttribute("inert");
    expect(grid).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector('button[data-index="0"]')).toBeDisabled();

    await waitFor(() =>
      expect(screen.getByText("37 contributions in the reported calendar.")).toBeInTheDocument(),
    );
    expect(fetcher).toHaveBeenCalledWith(
      "/api/github/contributions",
      expect.objectContaining({ cache: "no-store", credentials: "same-origin" }),
    );
    expect(grid).toHaveAttribute("role", "group");
    expect(grid).toHaveAccessibleName(
      /37 GitHub contributions across 1 active day in the reported calendar/i,
    );
    expect(grid).toHaveAttribute(
      "aria-describedby",
      "github-contribution-keyboard-instructions",
    );
    expect(grid).toHaveAccessibleDescription(
      "Arrow keys move between days. Enter opens details. Escape closes details.",
    );
    expect(grid).not.toHaveAttribute("inert");
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
    expect(dither).toHaveAttribute("data-dither-speed", "0.32");
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
    expect(STYLES).toMatch(
      /\.contribution-cell:focus-visible\s*\{[\s\S]*?outline:\s*2px solid var\(--signal\)/,
    );
    expect(STYLES).toMatch(
      /\.contribution-popover\s*\{[\s\S]*?overflow:\s*clip/,
    );
    expect(STYLES).not.toMatch(
      /\.contribution-popover[^{]*\{[^}]*overflow-[xy]:\s*(?:auto|scroll)/,
    );
    const legend = document.querySelector<HTMLElement>(".contribution-legend");
    expect(legend).toHaveAccessibleName(
      "Contribution density from quiet to active",
    );
    expect(screen.queryByText("Public activity")).not.toBeInTheDocument();

    const activeCell = document.querySelector<HTMLButtonElement>('button[data-index="0"]');
    expect(activeCell).toHaveAccessibleName(
      /Sunday, July 13, 2025: 3 contributions; 3 commits, 1 pull request, 1 issue/i,
    );
    if (!activeCell) throw new Error("Expected the first contribution cell");
    fireEvent.pointerEnter(activeCell);
    const transientPopover = document.querySelector<HTMLElement>(
      ".contribution-popover",
    );
    if (!transientPopover) throw new Error("Expected transient activity details");
    expect(transientPopover).toHaveAttribute("role", "status");
    expect(transientPopover).toHaveTextContent("Fix the activity field");
    expect(within(transientPopover).queryByRole("link", {
      name: "Fix the activity field",
    })).not.toBeInTheDocument();
    expect(transientPopover.querySelector(".contribution-popover__close"))
      .not.toBeInTheDocument();
    expect(within(transientPopover).getByRole("heading", {
      name: "Sunday, July 13, 2025",
    })).toBeVisible();
    expect(within(transientPopover).getAllByText("cloud")).toHaveLength(2);
    expect(within(transientPopover).queryByText("cumulus/cloud"))
      .not.toBeInTheDocument();
    expect(transientPopover).toHaveAttribute(
      "data-viewport-portal",
      "true",
    );
    expect(transientPopover.parentElement).toBe(document.body);

    fireEvent.click(activeCell, { detail: 1 });
    const pinnedPopover = document.querySelector<HTMLElement>(
      ".contribution-popover",
    );
    if (!pinnedPopover) throw new Error("Expected pinned activity details");
    expect(within(pinnedPopover).getByRole("button", {
      name: "Close activity details",
    })).toBeVisible();
    expect(within(pinnedPopover).getByRole("link", {
      name: "Fix the activity field",
    })).toHaveAttribute(
      "href",
      "https://github.com/cumulus/cloud/pull/12",
    );
    expect(activeCell).toHaveAttribute("aria-pressed", "true");
    expect(activeCell).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(activeCell, { detail: 1 });
    expect(activeCell).toHaveAttribute("aria-pressed", "true");
    const otherCell = document.querySelector<HTMLButtonElement>('button[data-index="7"]');
    if (!otherCell) throw new Error("Expected a second contribution cell");
    fireEvent.pointerEnter(otherCell, { pointerType: "mouse" });
    expect(within(pinnedPopover).getByRole("heading", {
      name: "Sunday, July 13, 2025",
    })).toBeVisible();

    fireEvent.click(otherCell, { detail: 1 });
    expect(activeCell).toHaveAttribute("aria-pressed", "false");
    expect(otherCell).toHaveAttribute("aria-pressed", "true");
    expect(within(pinnedPopover).getByRole("heading", {
      name: "Sunday, July 20, 2025",
    })).toBeVisible();

    fireEvent.pointerDown(document.body);
    expect(otherCell).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector(".contribution-popover__close"))
      .not.toBeInTheDocument();

    fireEvent.pointerEnter(activeCell, { pointerType: "mouse" });
    const hoveredPopover = document.querySelector<HTMLElement>(
      ".contribution-popover",
    );
    if (!hoveredPopover) throw new Error("Expected hovered activity details");
    expect(within(hoveredPopover).getByRole("heading", {
      name: "Sunday, July 13, 2025",
    })).toBeVisible();
    fireEvent.pointerLeave(activeCell, { pointerType: "mouse" });
    expect(document.querySelector(".contribution-popover__close"))
      .not.toBeInTheDocument();

    fireEvent.focus(activeCell);
    const focusedPopover = document.querySelector<HTMLElement>(
      ".contribution-popover",
    );
    if (!focusedPopover) throw new Error("Expected focused activity details");
    expect(within(focusedPopover).getByRole("heading", {
      name: "Sunday, July 13, 2025",
    })).toBeVisible();
    fireEvent.blur(activeCell);
    expect(document.querySelector(".contribution-popover__close"))
      .not.toBeInTheDocument();
    fireEvent.pointerEnter(activeCell, { pointerType: "mouse" });

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
    const popover = document.querySelector<HTMLElement>(".contribution-popover");
    if (!popover) throw new Error("Expected the activity popover");
    Object.defineProperty(popover, "offsetWidth", { configurable: true, value: 384 });
    Object.defineProperty(popover, "offsetHeight", { configurable: true, value: 320 });
    const viewportWidth = vi.spyOn(window, "innerWidth", "get").mockReturnValue(1_000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(600);
    const cellRect = vi.spyOn(activeCell, "getBoundingClientRect");
    cellRect.mockReturnValue({
      bottom: 562,
      height: 12,
      left: 900,
      right: 912,
      top: 550,
      width: 12,
      x: 900,
      y: 550,
      toJSON: () => ({}),
    });

    fireEvent.resize(window);
    await waitFor(() => expect(popover).toHaveAttribute("data-popover-side", "left"));
    expect(popover.style.getPropertyValue("--popover-left")).toBe("499px");
    expect(popover.style.getPropertyValue("--popover-top")).toBe("264px");
    expect(popover.style.getPropertyValue("--popover-max-height")).toBe("568px");
    expect(popover.style.getPropertyValue("--popover-arrow-top")).toBe("292px");

    cellRect.mockReturnValue({
      bottom: 112,
      height: 12,
      left: 650,
      right: 662,
      top: 100,
      width: 12,
      x: 650,
      y: 100,
      toJSON: () => ({}),
    });
    fireEvent.resize(window);
    await waitFor(() => expect(popover).toHaveAttribute("data-popover-side", "left"));
    expect(popover.style.getPropertyValue("--popover-left")).toBe("249px");
    const finalScaledCellLeft = 647;
    const panelRight = Number.parseFloat(
      popover.style.getPropertyValue("--popover-left"),
    ) + popover.offsetWidth;
    expect(panelRight).toBeLessThanOrEqual(finalScaledCellLeft);

    cellRect.mockReturnValue({
      bottom: 112,
      height: 12,
      left: 88,
      right: 100,
      top: 100,
      width: 12,
      x: 88,
      y: 100,
      toJSON: () => ({}),
    });
    fireEvent.resize(window);
    await waitFor(() => expect(popover).toHaveAttribute("data-popover-side", "right"));
    expect(popover.style.getPropertyValue("--popover-left")).toBe("117px");

    viewportWidth.mockReturnValue(800);
    cellRect.mockReturnValue({
      bottom: 112,
      height: 12,
      left: 394,
      right: 406,
      top: 100,
      width: 12,
      x: 394,
      y: 100,
      toJSON: () => ({}),
    });
    fireEvent.resize(window);
    await waitFor(() => expect(popover).toHaveAttribute("data-popover-side", "bottom"));
    expect(popover.style.getPropertyValue("--popover-top")).toBe("129px");

    fireEvent.pointerMove(frame as HTMLElement, {
      clientX: 900,
      clientY: 100,
      pointerType: "mouse",
    });
    await waitFor(() =>
      expect(frame?.style.getPropertyValue("--graph-rotate-y")).not.toBe("0deg"),
    );

    fireEvent.pointerMove(activeCell, {
      clientX: 902,
      clientY: 102,
      pointerType: "mouse",
    });
    expect(frame).toHaveAttribute("data-grid-interacting", "true");
    expect(frame.style.getPropertyValue("--graph-rotate-x")).toBe("0deg");
    expect(frame.style.getPropertyValue("--graph-rotate-y")).toBe("0deg");
    expect(frame.style.getPropertyValue("--graph-shift-x")).toBe("0px");
    expect(frame.style.getPropertyValue("--graph-shift-y")).toBe("0px");

    fireEvent.focus(activeCell);
    fireEvent.keyDown(activeCell, { key: "ArrowRight" });
    expect(document.activeElement).toBe(otherCell);
    expect(activeCell).toHaveAttribute("tabindex", "-1");
    expect(otherCell).toHaveAttribute("tabindex", "0");

    fireEvent.click(activeCell, { detail: 0 });
    await waitFor(() => expect(document.activeElement).toBe(popover));
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(activeCell).toHaveAttribute("aria-pressed", "false"));
    expect(document.querySelector(".contribution-popover__close"))
      .not.toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(activeCell));

    fireEvent.click(activeCell, { detail: 1 });
    const closePopover = document.querySelector<HTMLElement>(
      ".contribution-popover",
    );
    if (!closePopover) throw new Error("Expected closable activity details");
    const closeButton = within(closePopover).getByRole("button", {
      name: "Close activity details",
    });
    fireEvent.focus(closeButton);
    fireEvent.click(closeButton);
    await waitFor(() => expect(document.activeElement).toBe(activeCell));
    expect(activeCell).toHaveAttribute("aria-pressed", "false");
    expect(document.querySelector(".contribution-popover__close"))
      .not.toBeInTheDocument();
  // This one case intentionally exercises the complete 371-cell keyboard,
  // pointer, portal, and positioning contract under parallel jsdom workers.
  }, 10_000);

  it("caps desktop highlights and announces omitted public items", async () => {
    stubPickerMedia(false);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(liveResponse(DENSE_HIGHLIGHT_PAYLOAD)),
    );

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(screen.getByText("37 contributions in the reported calendar.")).toBeInTheDocument(),
    );
    const activeCell = document.querySelector<HTMLButtonElement>('button[data-index="0"]');
    if (!activeCell) throw new Error("Expected the first contribution cell");
    fireEvent.pointerEnter(activeCell, { pointerType: "mouse" });

    const popover = document.querySelector<HTMLElement>(".contribution-popover");
    if (!popover) throw new Error("Expected desktop activity details");
    expect(popover).toHaveAttribute("role", "status");
    expect(popover).toHaveAttribute("data-highlight-limit", "3");
    expect(popover).toHaveAttribute("data-highlights-truncated", "true");
    expect(popover.querySelectorAll("li")).toHaveLength(3);
    expect(within(popover).getByText("2 more public items not shown.")).toHaveAttribute(
      "data-highlight-overflow-note",
      "true",
    );
    expect(within(popover).queryByText("Refine responsive graph"))
      .not.toBeInTheDocument();
    expect(within(popover).queryByText("Keep page scroll native"))
      .not.toBeInTheDocument();
  });

  it("uses the picker as the sole responsive interaction and restores its focus", async () => {
    stubPickerMedia(true);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(liveResponse(DENSE_HIGHLIGHT_PAYLOAD)),
    );

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(screen.getByText("37 contributions in the reported calendar.")).toBeInTheDocument(),
    );
    expect(document.querySelector(".contribution-frame")).toHaveAttribute(
      "data-picker-mode",
      "true",
    );
    expect(document.querySelector(".contribution-grid")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector(".contribution-grid")).toHaveAttribute("inert");
    expect(document.querySelector('button[data-index="0"]')).toBeDisabled();

    const picker = document.querySelector<HTMLSelectElement>(
      ".contribution-touch-picker select",
    );
    if (!picker) throw new Error("Expected the responsive contribution picker");
    expect(picker).toHaveAccessibleName("Choose a day");
    expect(picker).toBeEnabled();
    fireEvent.change(picker, { target: { value: "2025-07-13" } });
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector(".contribution-popover")),
    );
    await waitFor(() =>
      expect(document.querySelector(".contribution-popover")).toHaveAttribute(
        "data-popover-side",
        "inline",
      ),
    );
    const popover = document.querySelector<HTMLElement>(".contribution-popover");
    if (!popover) throw new Error("Expected inline activity details");
    expect(popover).not.toHaveAttribute("data-viewport-portal");
    expect(popover.parentElement).toHaveClass("contribution-surface");
    expect(popover).toHaveAttribute("data-highlight-limit", "2");
    expect(popover).toHaveAttribute("data-highlights-truncated", "true");
    expect(popover.querySelectorAll("li")).toHaveLength(2);
    expect(within(popover).getByText("3 more public items not shown.")).toHaveAttribute(
      "data-highlight-overflow-note",
      "true",
    );
    expect(within(popover).queryByText("Document keyboard focus"))
      .not.toBeInTheDocument();

    const frame = document.querySelector<HTMLElement>(".contribution-frame");
    if (!frame) throw new Error("Expected the contribution frame");
    const frameRect = vi.spyOn(frame, "getBoundingClientRect");
    fireEvent.pointerMove(frame, {
      clientX: 900,
      clientY: 100,
      pointerType: "mouse",
    });
    expect(frame).toHaveAttribute("data-tilt-enabled", "false");
    expect(frameRect).not.toHaveBeenCalled();
    expect(frame.style.getPropertyValue("--graph-rotate-x")).toBe("0deg");
    expect(frame.style.getPropertyValue("--graph-rotate-y")).toBe("0deg");

    fireEvent.click(within(popover).getByRole("button", {
      name: "Close activity details",
    }));
    await waitFor(() => expect(document.activeElement).toBe(picker));

    fireEvent.change(picker, { target: { value: "2025-07-13" } });
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector(".contribution-popover")),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(picker));
  });

  it("suspends a portaled panel when navigation or a modal owns the page", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(liveResponse()));

    render(
      <div className="site-frame">
        <header className="site-header">
          <button type="button">Menu</button>
        </header>
        <GitHubContributionGraph />
      </div>,
    );

    await waitFor(() =>
      expect(screen.getByText("37 contributions in the reported calendar.")).toBeInTheDocument(),
    );
    const cell = document.querySelector<HTMLButtonElement>('button[data-index="0"]');
    const siteFrame = document.querySelector<HTMLElement>(".site-frame");
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    if (!cell || !siteFrame || !siteHeader) throw new Error("Expected graph shell elements");

    fireEvent.click(cell, { detail: 1 });
    expect(document.querySelector(".contribution-popover")).toBeInTheDocument();
    siteFrame.setAttribute("inert", "");
    siteFrame.setAttribute("aria-hidden", "true");
    await waitFor(() =>
      expect(document.querySelector(".contribution-popover")).not.toBeInTheDocument(),
    );

    siteFrame.removeAttribute("inert");
    siteFrame.removeAttribute("aria-hidden");
    fireEvent.click(cell, { detail: 1 });
    expect(document.querySelector(".contribution-popover")).toBeInTheDocument();
    const menu = within(siteHeader).getByRole("button", { name: "Menu" });
    menu.focus();
    expect(document.activeElement).toBe(menu);
    siteHeader.setAttribute("data-open", "");
    await waitFor(() =>
      expect(document.querySelector(".contribution-popover")).not.toBeInTheDocument(),
    );
    expect(document.activeElement).toBe(menu);
  });

  it("renders an honest no-data graph when the server boundary fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    render(<GitHubContributionGraph />);

    await waitFor(() =>
      expect(
        screen.getByText(/empty grid contains no inferred counts/i),
      ).toBeInTheDocument(),
    );
    const unavailableGrid = document.querySelector(".contribution-grid");
    expect(unavailableGrid).toHaveAttribute("aria-hidden", "true");
    expect(unavailableGrid).toHaveAttribute("inert");
    expect(document.querySelector('button[data-index="0"]')).toBeDisabled();
    const picker = document.querySelector<HTMLSelectElement>(
      ".contribution-touch-picker select",
    );
    expect(picker).toHaveAccessibleName("Choose a day");
    expect(picker).toBeDisabled();
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
