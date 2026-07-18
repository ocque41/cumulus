import { readFileSync } from "node:fs";

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("GitHubContributionGraph", () => {
  it("uses the same-origin contribution boundary and announces validated data", async () => {
    const fetcher = vi.fn().mockResolvedValue(liveResponse());
    vi.stubGlobal("fetch", fetcher);

    render(<GitHubContributionGraph />);
    expect(
      document.querySelector('.contribution-frame[data-load-state="loading"]'),
    ).toHaveAttribute("data-texture", "dither");
    expect(document.querySelector(".contribution-grid")).toHaveAttribute("inert");
    expect(document.querySelector(".contribution-grid")).toHaveAttribute("aria-hidden", "true");
    expect(document.querySelector('button[data-index="0"]')).toBeDisabled();

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
    expect(screen.getByRole("group")).toHaveAttribute(
      "aria-describedby",
      "github-contribution-keyboard-instructions",
    );
    expect(screen.getByRole("group")).toHaveAccessibleDescription(
      "Arrow keys move between days. Enter opens details. Escape closes details.",
    );
    expect(screen.getByRole("group")).not.toHaveAttribute("inert");
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
    expect(dither).toHaveAttribute("data-dither-speed", "0.06");
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
      /\.contribution-popover\[data-viewport-portal="true"\]\[data-popover-state="pinned"\]\s*\{[\s\S]*?overflow-y:\s*auto/,
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
    expect(screen.getByRole("status")).toHaveTextContent("Fix the activity field");
    expect(screen.queryByRole("link", { name: "Fix the activity field" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sunday, July 13, 2025" })).toBeVisible();
    expect(screen.getAllByText("cloud")).toHaveLength(2);
    expect(screen.queryByText("cumulus/cloud")).not.toBeInTheDocument();
    expect(document.querySelector(".contribution-popover")).toHaveAttribute(
      "data-viewport-portal",
      "true",
    );
    expect(document.querySelector(".contribution-popover")?.parentElement).toBe(document.body);

    fireEvent.click(activeCell, { detail: 1 });
    expect(screen.getByRole("button", { name: "Close activity details" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Fix the activity field" })).toHaveAttribute(
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
    expect(screen.getByRole("heading", { name: "Sunday, July 13, 2025" })).toBeVisible();

    fireEvent.click(otherCell, { detail: 1 });
    expect(activeCell).toHaveAttribute("aria-pressed", "false");
    expect(otherCell).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "Sunday, July 20, 2025" })).toBeVisible();

    fireEvent.pointerDown(document.body);
    expect(otherCell).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();

    fireEvent.pointerEnter(activeCell, { pointerType: "mouse" });
    expect(screen.getByRole("heading", { name: "Sunday, July 13, 2025" })).toBeVisible();
    fireEvent.pointerLeave(activeCell, { pointerType: "mouse" });
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();

    fireEvent.focus(activeCell);
    expect(screen.getByRole("heading", { name: "Sunday, July 13, 2025" })).toBeVisible();
    fireEvent.blur(activeCell);
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();
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
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(activeCell));

    fireEvent.click(activeCell, { detail: 1 });
    const closeButton = screen.getByRole("button", { name: "Close activity details" });
    fireEvent.focus(closeButton);
    fireEvent.click(closeButton);
    await waitFor(() => expect(document.activeElement).toBe(activeCell));
    expect(activeCell).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();

    const touchPicker = screen.getByLabelText("Choose a day");
    fireEvent.change(touchPicker, { target: { value: "2025-07-13" } });
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector(".contribution-popover")),
    );
    expect(activeCell).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Close activity details" }));
    await waitFor(() => expect(document.activeElement).toBe(touchPicker));
    expect(activeCell).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "Close activity details" })).not.toBeInTheDocument();

    fireEvent.change(touchPicker, { target: { value: "2025-07-13" } });
    await waitFor(() =>
      expect(document.activeElement).toBe(document.querySelector(".contribution-popover")),
    );
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(document.activeElement).toBe(touchPicker));
    expect(activeCell).toHaveAttribute("aria-pressed", "false");
  }, 20_000);

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

    const popover = screen.getByRole("status");
    expect(popover).toHaveAttribute("data-highlight-limit", "3");
    expect(popover).toHaveAttribute("data-highlights-truncated", "true");
    expect(popover.querySelectorAll("li")).toHaveLength(3);
    expect(screen.getByText("2 more public items not shown.")).toHaveAttribute(
      "data-highlight-overflow-note",
      "true",
    );
    expect(screen.queryByText("Refine responsive graph")).not.toBeInTheDocument();
    expect(screen.queryByText("Keep page scroll native")).not.toBeInTheDocument();
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
    expect(screen.queryByRole("group")).not.toBeInTheDocument();

    const picker = screen.getByLabelText("Choose a day");
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
    expect(popover).not.toHaveAttribute("data-viewport-portal");
    expect(popover?.parentElement).toHaveClass("contribution-surface");
    expect(popover).toHaveAttribute("data-highlight-limit", "2");
    expect(popover).toHaveAttribute("data-highlights-truncated", "true");
    expect(popover?.querySelectorAll("li")).toHaveLength(2);
    expect(screen.getByText("3 more public items not shown.")).toHaveAttribute(
      "data-highlight-overflow-note",
      "true",
    );
    expect(screen.queryByText("Document keyboard focus")).not.toBeInTheDocument();

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

    fireEvent.click(screen.getByRole("button", { name: "Close activity details" }));
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
    const menu = screen.getByRole("button", { name: "Menu" });
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
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    expect(document.querySelector('button[data-index="0"]')).toBeDisabled();
    expect(screen.getByLabelText("Choose a day")).toBeDisabled();
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
