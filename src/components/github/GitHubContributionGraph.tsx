import {
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { HeroDither } from "@/components/visual/HeroDither";

import { useContributionTilt } from "./useContributionTilt";

const USERNAME = "ocque41";
const ENDPOINT = "/api/github/contributions";
const DAY = 86_400_000;
const WEEK_COUNT = 53;
const DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  dateStyle: "full",
  timeZone: "UTC",
});

interface Contribution {
  count: number;
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}

type ActivityKind = "commit" | "issue" | "pull-request";

interface ActivityHighlight {
  kind: ActivityKind;
  repository: string;
  title: string;
  url?: string;
}

interface ActivityDay {
  commits: number | null;
  date: string;
  highlights: ActivityHighlight[];
  issues: number;
  pullRequests: number;
}

interface ContributionsResponse {
  activityDays: ActivityDay[];
  activityDetailStatus: "live" | "unavailable";
  contributions: Contribution[];
  fetchedAt: string;
  totalContributions: number;
  username: typeof USERNAME;
}

interface CalendarDay {
  contribution?: Contribution;
  date: string;
}

type LoadState = "fallback" | "live" | "loading";

type PopoverSide = "bottom" | "inline" | "left" | "right" | "sheet" | "top";

interface PopoverPosition {
  arrowLeft: number;
  arrowTop: number;
  left: number;
  maxHeight: number;
  side: PopoverSide;
  top: number;
  width: number;
}

type PopoverStyle = CSSProperties & {
  "--popover-arrow-left": string;
  "--popover-arrow-top": string;
  "--popover-left": string;
  "--popover-max-height": string;
  "--popover-top": string;
  "--popover-width": string;
};

const POPOVER_ID = "github-contribution-details";
const POPOVER_HEADING_ID = "github-contribution-details-title";
const GRID_KEYBOARD_INSTRUCTIONS_ID = "github-contribution-keyboard-instructions";
const POPOVER_GAP = 14;
const POPOVER_MARGIN = 16;
const POPOVER_HEADER_GAP = 8;
const POPOVER_FALLBACK_WIDTH = 384;
const POPOVER_FALLBACK_HEIGHT = 320;
const POPOVER_ARROW_MARGIN = 20;
const ACTIVE_CELL_SCALE = 1.5;
const PICKER_MEDIA_QUERY = "(pointer: coarse), (max-width: 1365px), (max-height: 640px)";
const CONTRIBUTION_DITHER_SPEED = 0.32;
const DESKTOP_HIGHLIGHT_LIMIT = 3;
const PICKER_HIGHLIGHT_LIMIT = 2;

function clamped(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

function matchesPickerMedia(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia(PICKER_MEDIA_QUERY).matches;
}

function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildCalendar(contributions: readonly Contribution[]): CalendarDay[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const end = new Date(today.getTime() + (6 - today.getUTCDay()) * DAY);
  const fallbackStart = new Date(end.getTime() - (WEEK_COUNT * 7 - 1) * DAY);
  const earliestObservedDate = contributions.reduce<string | undefined>(
    (earliest, item) =>
      earliest === undefined || item.date < earliest ? item.date : earliest,
    undefined,
  );
  const earliestObserved = earliestObservedDate
    ? new Date(`${earliestObservedDate}T00:00:00.000Z`)
    : undefined;
  const start = earliestObserved
    ? new Date(earliestObserved.getTime() - earliestObserved.getUTCDay() * DAY)
    : fallbackStart;
  const byDate = new Map(contributions.map((item) => [item.date, item]));

  return Array.from({ length: WEEK_COUNT * 7 }, (_, index) => {
    const date = dayKey(new Date(start.getTime() + index * DAY));
    return { contribution: byDate.get(date), date };
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isContribution(value: unknown): value is Contribution {
  if (!isRecord(value)) return false;
  return (
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    isSafeCount(value.count) &&
    typeof value.level === "number" &&
    Number.isInteger(value.level) &&
    value.level >= 0 &&
    value.level <= 4
  );
}

function isGithubUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 512) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "github.com";
  } catch {
    return false;
  }
}

function isActivityHighlight(value: unknown): value is ActivityHighlight {
  if (!isRecord(value)) return false;
  return (
    (value.kind === "commit" || value.kind === "issue" || value.kind === "pull-request") &&
    typeof value.repository === "string" &&
    /^[A-Za-z0-9_.-]{1,100}\/[A-Za-z0-9_.-]{1,100}$/.test(value.repository) &&
    typeof value.title === "string" &&
    value.title.length > 0 &&
    value.title.length <= 140 &&
    (value.url === undefined || isGithubUrl(value.url))
  );
}

function isActivityDay(value: unknown): value is ActivityDay {
  if (!isRecord(value)) return false;
  return (
    typeof value.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    (value.commits === null || isSafeCount(value.commits)) &&
    isSafeCount(value.issues) &&
    isSafeCount(value.pullRequests) &&
    Array.isArray(value.highlights) &&
    value.highlights.length <= 6 &&
    value.highlights.every(isActivityHighlight)
  );
}

function parseResponse(value: unknown): ContributionsResponse {
  if (!isRecord(value)) throw new Error("Invalid response");
  const legacyActivity = value.activityDays === undefined && value.activityDetailStatus === undefined;
  const activityDays = legacyActivity ? [] : value.activityDays;
  const activityDetailStatus = legacyActivity ? "unavailable" : value.activityDetailStatus;

  if (
    value.username !== USERNAME ||
    !Array.isArray(value.contributions) ||
    !value.contributions.every(isContribution) ||
    !isSafeCount(value.totalContributions) ||
    typeof value.fetchedAt !== "string" ||
    Number.isNaN(Date.parse(value.fetchedAt)) ||
    !Array.isArray(activityDays) ||
    activityDays.length > 371 ||
    !activityDays.every(isActivityDay) ||
    (activityDetailStatus !== "live" && activityDetailStatus !== "unavailable")
  ) {
    throw new Error("Invalid contribution payload");
  }

  return {
    activityDays,
    activityDetailStatus,
    contributions: value.contributions,
    fetchedAt: value.fetchedAt,
    totalContributions: value.totalContributions,
    username: USERNAME,
  };
}

function formattedDate(date: string): string {
  return DATE_FORMATTER.format(new Date(`${date}T00:00:00.000Z`));
}

function counted(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function publicRepositoryLabel(repository: string): string {
  return repository.split("/").at(-1) ?? repository;
}

function cellLabel(day: CalendarDay, activity?: ActivityDay): string {
  const contributionText = day.contribution
    ? `${day.contribution.count} contribution${day.contribution.count === 1 ? "" : "s"}`
    : "contribution count unavailable";
  if (!activity) return `${formattedDate(day.date)}: ${contributionText}; detailed activity unavailable.`;
  const commits = activity.commits === null
    ? "commit count unavailable"
    : counted(activity.commits, "commit");
  return `${formattedDate(day.date)}: ${contributionText}; ${commits}, ${counted(activity.pullRequests, "pull request")}, ${counted(activity.issues, "issue")}.`;
}

export function GitHubContributionGraph() {
  const [payload, setPayload] = useState<ContributionsResponse>();
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [focusedDate, setFocusedDate] = useState<string>();
  const [hoveredDate, setHoveredDate] = useState<string>();
  const [pinnedDate, setPinnedDate] = useState<string>();
  const [pickerMode, setPickerMode] = useState(matchesPickerMedia);
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition>({
    arrowLeft: POPOVER_ARROW_MARGIN,
    arrowTop: POPOVER_ARROW_MARGIN,
    left: POPOVER_MARGIN,
    maxHeight: POPOVER_FALLBACK_HEIGHT,
    side: "right",
    top: POPOVER_MARGIN,
    width: POPOVER_FALLBACK_WIDTH,
  });
  const [rovingIndex, setRovingIndex] = useState<number>();
  const gridRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLSelectElement>(null);
  const pinnedTriggerRef = useRef<HTMLElement>(null);
  const popoverRef = useRef<HTMLElement>(null);
  const suppressRestoredFocusRef = useRef(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(PICKER_MEDIA_QUERY);
    const updatePickerMode = () => setPickerMode(media.matches);
    updatePickerMode();
    media.addEventListener("change", updatePickerMode);
    return () => media.removeEventListener("change", updatePickerMode);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(ENDPOINT, {
      cache: "no-store",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Contribution endpoint unavailable");
        return parseResponse(await response.json());
      })
      .then((nextPayload) => {
        setPayload(nextPayload);
        setLoadState("live");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPayload(undefined);
        setLoadState("fallback");
      });
    return () => {
      controller.abort();
    };
  }, []);

  const calendar = useMemo(
    () => buildCalendar(payload?.contributions ?? []),
    [payload?.contributions],
  );
  const activityByDate = useMemo(
    () => new Map(payload?.activityDays.map((day) => [day.date, day]) ?? []),
    [payload?.activityDays],
  );
  const cellLabels = useMemo(
    () => calendar.map((day) => cellLabel(day, activityByDate.get(day.date))),
    [activityByDate, calendar],
  );
  const activeDays = payload?.contributions.filter((day) => day.count > 0).length ?? 0;
  const selectedDate = pinnedDate ?? hoveredDate ?? focusedDate;
  const selectedDay = selectedDate
    ? calendar.find((day) => day.date === selectedDate)
    : undefined;
  const selectedActivity = selectedDate ? activityByDate.get(selectedDate) : undefined;
  const highlightLimit = pickerMode ? PICKER_HIGHLIGHT_LIMIT : DESKTOP_HIGHLIGHT_LIMIT;
  const selectedHighlights = selectedActivity?.highlights.slice(0, highlightLimit) ?? [];
  const hiddenHighlightCount = Math.max(
    0,
    (selectedActivity?.highlights.length ?? 0) - selectedHighlights.length,
  );
  const today = dayKey(new Date());
  const initialTabIndex = useMemo(
    () => calendar.reduce(
      (latest, day, index) => (day.date <= today ? index : latest),
      0,
    ),
    [calendar, today],
  );
  const tabStopIndex = rovingIndex ?? initialTabIndex;
  const graphAvailable = loadState === "live" && payload !== undefined;
  const gridInteractive = graphAvailable && !pickerMode;

  const dismissPinnedDate = useCallback((restoreFocus: boolean) => {
    const trigger = pinnedTriggerRef.current;
    pinnedTriggerRef.current = null;
    setFocusedDate(undefined);
    setHoveredDate(undefined);
    setPinnedDate(undefined);

    if (!restoreFocus || !trigger) return;
    requestAnimationFrame(() => {
      suppressRestoredFocusRef.current = true;
      trigger.focus({ preventScroll: true });
      queueMicrotask(() => {
        suppressRestoredFocusRef.current = false;
      });
    });
  }, []);

  const pinDate = useCallback(
    (date: string, trigger?: HTMLElement, moveFocusToDetails = false) => {
      pinnedTriggerRef.current = trigger ?? null;
      setFocusedDate(date);
      setHoveredDate(undefined);
      setPinnedDate(date);

      if (!moveFocusToDetails) return;
      requestAnimationFrame(() => {
        popoverRef.current?.focus({ preventScroll: true });
      });
    },
    [],
  );

  useEffect(() => {
    if (!pickerMode && graphAvailable) return;

    let active = true;
    queueMicrotask(() => {
      if (active) dismissPinnedDate(false);
    });
    return () => {
      active = false;
    };
  }, [dismissPinnedDate, graphAvailable, pickerMode]);

  useEffect(() => {
    if (typeof MutationObserver === "undefined") return;
    const siteFrame = document.querySelector<HTMLElement>(".site-frame");
    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    if (!siteFrame && !siteHeader) return;

    const dismissForBlockingSurface = () => {
      const modalOwnsFocus = siteFrame?.hasAttribute("inert")
        || siteFrame?.getAttribute("aria-hidden") === "true";
      const menuOwnsFocus = siteHeader?.hasAttribute("data-open");
      if (modalOwnsFocus || menuOwnsFocus) dismissPinnedDate(false);
    };
    const observer = new MutationObserver(dismissForBlockingSurface);
    if (siteFrame) {
      observer.observe(siteFrame, {
        attributeFilter: ["aria-hidden", "inert"],
        attributes: true,
      });
    }
    if (siteHeader) {
      observer.observe(siteHeader, {
        attributeFilter: ["data-open"],
        attributes: true,
      });
    }
    dismissForBlockingSurface();
    return () => observer.disconnect();
  }, [dismissPinnedDate]);

  const positionPopover = useCallback(() => {
    if (!selectedDate || pickerMode || typeof window === "undefined") return;
    const anchor = gridRef.current?.querySelector<HTMLButtonElement>(
      `button[data-date="${selectedDate}"]`,
    );
    const popover = popoverRef.current;
    if (!anchor || !popover) return;

    const anchorRect = anchor.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportLeft = visualViewport?.offsetLeft ?? 0;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportWidth = Math.max(
      visualViewport?.width || document.documentElement.clientWidth || window.innerWidth,
      1,
    );
    const viewportHeight = Math.max(
      visualViewport?.height || document.documentElement.clientHeight || window.innerHeight,
      1,
    );
    const viewportRight = viewportLeft + viewportWidth;
    const viewportBottom = viewportTop + viewportHeight;
    const headerBottom = document.querySelector<HTMLElement>(".site-header")
      ?.getBoundingClientRect().bottom ?? viewportTop;
    const minTop = Math.min(
      Math.max(viewportTop + POPOVER_MARGIN, headerBottom + POPOVER_HEADER_GAP),
      Math.max(viewportTop, viewportBottom - POPOVER_MARGIN),
    );
    const availableWidth = Math.max(1, viewportWidth - POPOVER_MARGIN * 2);
    const measuredWidth = popover.offsetWidth || POPOVER_FALLBACK_WIDTH;
    const panelWidth = Math.min(measuredWidth, availableWidth);
    const minLeft = viewportLeft + POPOVER_MARGIN;
    const maxLeft = Math.max(minLeft, viewportRight - POPOVER_MARGIN - panelWidth);
    const maxAvailableHeight = Math.max(1, viewportBottom - minTop - POPOVER_MARGIN);
    const measuredHeight = popover.offsetHeight || POPOVER_FALLBACK_HEIGHT;
    const panelHeight = Math.min(measuredHeight, maxAvailableHeight);
    const anchorCenterX = anchorRect.left + anchorRect.width / 2;
    const anchorCenterY = anchorRect.top + anchorRect.height / 2;
    const horizontalGap = POPOVER_GAP + anchorRect.width * (ACTIVE_CELL_SCALE - 1) / 2;
    const verticalGap = POPOVER_GAP + anchorRect.height * (ACTIVE_CELL_SCALE - 1) / 2;
    const rightSpace = viewportRight - POPOVER_MARGIN - anchorRect.right - horizontalGap;
    const leftSpace = anchorRect.left - horizontalGap - minLeft;
    const bottomSpace = viewportBottom - POPOVER_MARGIN - anchorRect.bottom - verticalGap;
    const topSpace = anchorRect.top - verticalGap - minTop;
    const anchorVisible = anchorRect.right >= viewportLeft
      && anchorRect.left <= viewportRight
      && anchorRect.bottom >= minTop
      && anchorRect.top <= viewportBottom;

    let side: PopoverSide;
    let left: number;
    let top: number;
    let width = panelWidth;
    let maxHeight = maxAvailableHeight;

    if (pickerMode || !anchorVisible) {
      side = "sheet";
      width = availableWidth;
      left = minLeft;
      maxHeight = Math.min(352, maxAvailableHeight);
      top = Math.max(minTop, viewportBottom - POPOVER_MARGIN - Math.min(measuredHeight, maxHeight));
    } else if (rightSpace >= panelWidth || leftSpace >= panelWidth) {
      const useRight = rightSpace >= panelWidth
        && (leftSpace < panelWidth || rightSpace >= leftSpace);
      side = useRight ? "right" : "left";
      left = useRight
        ? anchorRect.right + horizontalGap
        : anchorRect.left - horizontalGap - panelWidth;
      top = clamped(
        anchorCenterY - panelHeight / 2,
        minTop,
        Math.max(minTop, viewportBottom - POPOVER_MARGIN - panelHeight),
      );
    } else {
      const useBottom = bottomSpace >= topSpace;
      side = useBottom ? "bottom" : "top";
      maxHeight = Math.max(1, useBottom ? bottomSpace : topSpace);
      const verticalPanelHeight = Math.min(measuredHeight, maxHeight);
      left = clamped(anchorCenterX - panelWidth / 2, minLeft, maxLeft);
      top = useBottom
        ? anchorRect.bottom + verticalGap
        : anchorRect.top - verticalGap - verticalPanelHeight;
    }

    const renderedHeight = Math.min(measuredHeight, maxHeight);
    const arrowLeft = clamped(
      anchorCenterX - left,
      POPOVER_ARROW_MARGIN,
      Math.max(POPOVER_ARROW_MARGIN, width - POPOVER_ARROW_MARGIN),
    );
    const arrowTop = clamped(
      anchorCenterY - top,
      POPOVER_ARROW_MARGIN,
      Math.max(POPOVER_ARROW_MARGIN, renderedHeight - POPOVER_ARROW_MARGIN),
    );

    setPopoverPosition((current) => {
      if (
        current.arrowLeft === arrowLeft
        && current.arrowTop === arrowTop
        && current.left === left
        && current.maxHeight === maxHeight
        && current.side === side
        && current.top === top
        && current.width === width
      ) {
        return current;
      }
      return { arrowLeft, arrowTop, left, maxHeight, side, top, width };
    });
  }, [pickerMode, selectedDate]);

  const resetHoveredDate = useCallback(() => {
    if (!pinnedDate) setHoveredDate(undefined);
  }, [pinnedDate]);
  const {
    frameRef,
    onFramePointerLeave,
    onFramePointerMove,
    onGridPointerEnter,
    onGridPointerLeave,
  } = useContributionTilt({
    active: selectedDay !== undefined,
    enabled: !pickerMode,
    onPositionChange: positionPopover,
    onResetHover: resetHoveredDate,
  });

  useLayoutEffect(() => {
    if (!selectedDate || typeof window === "undefined") return;
    const initialPositionFrame = requestAnimationFrame(positionPopover);

    const handleViewportChange = () => {
      positionPopover();
    };
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    window.visualViewport?.addEventListener("resize", handleViewportChange);
    window.visualViewport?.addEventListener("scroll", handleViewportChange);

    const anchor = gridRef.current?.querySelector<HTMLButtonElement>(
      `button[data-date="${selectedDate}"]`,
    );
    const resizeObserver = typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(handleViewportChange);
    if (anchor) resizeObserver?.observe(anchor);
    if (popoverRef.current) resizeObserver?.observe(popoverRef.current);

    return () => {
      cancelAnimationFrame(initialPositionFrame);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      window.visualViewport?.removeEventListener("resize", handleViewportChange);
      window.visualViewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [positionPopover, selectedDate]);

  useEffect(() => {
    if (!pinnedDate) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (popoverRef.current?.contains(target)) return;
      if (target instanceof Element) {
        const targetCell = target.closest("button.contribution-cell");
        if (targetCell && gridRef.current?.contains(targetCell)) return;
        const touchPicker = target.closest(".contribution-touch-picker");
        if (touchPicker) return;
      }
      dismissPinnedDate(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const restoreFocus = Boolean(
        document.activeElement && popoverRef.current?.contains(document.activeElement),
      );
      dismissPinnedDate(restoreFocus);
    };

    document.addEventListener("pointerdown", handleOutsidePointer, true);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [dismissPinnedDate, pinnedDate]);

  const moveCellFocus = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const offsets: Record<string, number> = {
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
      ArrowUp: -1,
    };
    if (event.key === "Escape") {
      if (!pinnedDate) {
        event.preventDefault();
        setFocusedDate(undefined);
        setHoveredDate(undefined);
      }
      return;
    }
    const targetIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? calendar.length - 1
        : offsets[event.key] === undefined
          ? undefined
          : Math.max(0, Math.min(calendar.length - 1, index + offsets[event.key]));
    if (targetIndex === undefined) return;
    event.preventDefault();
    setRovingIndex(targetIndex);
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-index="${targetIndex}"]`)
      ?.focus();
  };

  const popoverStyle: PopoverStyle = {
    "--popover-arrow-left": `${popoverPosition.arrowLeft}px`,
    "--popover-arrow-top": `${popoverPosition.arrowTop}px`,
    "--popover-left": `${popoverPosition.left}px`,
    "--popover-max-height": `${popoverPosition.maxHeight}px`,
    "--popover-top": `${popoverPosition.top}px`,
    "--popover-width": `${popoverPosition.width}px`,
  };
  const popoverPinned = pinnedDate !== undefined;

  const popoverPanel = selectedDay
    ? (
        <aside
          aria-atomic="true"
          aria-labelledby={POPOVER_HEADING_ID}
          aria-live="polite"
          className="contribution-popover"
          data-anchor-date={selectedDay.date}
          data-highlight-limit={highlightLimit}
          data-highlights-truncated={hiddenHighlightCount > 0 ? "true" : undefined}
          data-popover-side={pickerMode ? "inline" : popoverPosition.side}
          data-popover-state={popoverPinned ? "pinned" : "transient"}
          data-texture="dither"
          data-viewport-portal={pickerMode ? undefined : "true"}
          id={POPOVER_ID}
          ref={popoverRef}
          role={popoverPinned ? "region" : "status"}
          style={pickerMode ? undefined : popoverStyle}
          tabIndex={popoverPinned ? -1 : undefined}
        >
          {popoverPinned ? (
            <button
              aria-label="Close activity details"
              className="contribution-popover__close"
              onClick={() => {
                dismissPinnedDate(true);
              }}
              type="button"
            >
              ×
            </button>
          ) : null}
          <p>CUMULUS / GITHUB SIGNAL</p>
          <h3 id={POPOVER_HEADING_ID}>{formattedDate(selectedDay.date)}</h3>
          <div className="contribution-popover__metrics">
            <span><strong>{selectedDay.contribution?.count ?? "—"}</strong> contributions</span>
            <span><strong>{selectedActivity?.commits ?? "—"}</strong> commits</span>
            <span><strong>{selectedActivity?.pullRequests ?? "—"}</strong> PRs</span>
            <span><strong>{selectedActivity?.issues ?? "—"}</strong> issues</span>
          </div>
          {selectedHighlights.length ? (
            <>
              <ul>
                {selectedHighlights.map((highlight, index) => (
                  <li key={`${highlight.kind}-${highlight.repository}-${index}`}>
                    <span>{highlight.kind.replace("pull-request", "PR")}</span>
                    {popoverPinned && highlight.url ? (
                      <a href={highlight.url} rel="noreferrer" target="_blank">{highlight.title}</a>
                    ) : <strong>{highlight.title}</strong>}
                    <small>{publicRepositoryLabel(highlight.repository)}</small>
                  </li>
                ))}
              </ul>
              {hiddenHighlightCount > 0 ? (
                <small
                  className="contribution-popover__note"
                  data-highlight-overflow-note="true"
                >
                  {counted(hiddenHighlightCount, "more public item")} not shown.
                </small>
              ) : null}
            </>
          ) : (
            <small className="contribution-popover__note">
              {payload?.activityDetailStatus === "live"
                ? "No public commit, pull-request, or issue detail was reported for this day."
                : "The aggregate count is verified; public item detail is unavailable for this day."}
            </small>
          )}
        </aside>
      )
    : null;
  const popover = popoverPanel && !pickerMode && typeof document !== "undefined"
    ? createPortal(popoverPanel, document.body)
    : null;

  return (
    <>
      <section aria-labelledby="github-title" className="github-panel" id="github">
        <h2 className="visually-hidden" id="github-title">GitHub activity graph</h2>
        <div className="contribution-stage">
          <div
            className="contribution-frame"
            data-load-state={loadState}
            data-picker-mode={pickerMode ? "true" : undefined}
            data-popover-side={pickerMode ? "inline" : popoverPosition.side}
            data-texture="dither"
            data-tilt-enabled={pickerMode ? "false" : "true"}
            onPointerLeave={onFramePointerLeave}
            onPointerMove={onFramePointerMove}
            ref={frameRef}
          >
            <HeroDither
              className="contribution-dither"
              fade
              fallbackClassName="contribution-dither__fallback"
              frame={841}
              maxPixelCount={520_000}
              data-dither-speed={CONTRIBUTION_DITHER_SPEED}
              shape="ripple"
              size={1.7}
              speed={CONTRIBUTION_DITHER_SPEED}
              type="8x8"
            />
            <div className="contribution-surface" data-texture="dither">
              <div className="contribution-heading">
                <span>CUMULUS / GITHUB</span>
                <strong>Activity field</strong>
                <small>
                  <span className="contribution-instruction contribution-instruction--pointer">
                    Hover / focus. Arrows move; Enter opens; Escape closes.
                  </span>
                  <span className="contribution-instruction contribution-instruction--touch">
                    Choose a day below
                  </span>
                </small>
              </div>
              <p className="visually-hidden" id={GRID_KEYBOARD_INSTRUCTIONS_ID}>
                Arrow keys move between days. Enter opens details. Escape closes details.
              </p>
              <div
                aria-describedby={gridInteractive ? GRID_KEYBOARD_INSTRUCTIONS_ID : undefined}
                aria-hidden={gridInteractive ? undefined : true}
                aria-label={
                  payload
                    ? `${payload.totalContributions} GitHub contributions across ${activeDays} active day${activeDays === 1 ? "" : "s"} in the reported calendar.`
                    : "The GitHub contribution graph is currently unavailable. Use the profile link for the current record."
                }
                className="contribution-grid"
                data-texture="dither"
                inert={!gridInteractive}
                onPointerEnter={onGridPointerEnter}
                onPointerLeave={onGridPointerLeave}
                ref={gridRef}
                role="group"
              >
                {calendar.map((day, index) => {
                  const activity = activityByDate.get(day.date);
                  const label = cellLabels[index] ?? cellLabel(day, activity);
                  const isPinned = pinnedDate === day.date;
                  return (
                    <button
                      aria-controls={isPinned ? POPOVER_ID : undefined}
                      aria-expanded={isPinned ? true : undefined}
                      aria-label={label}
                      aria-pressed={isPinned}
                      className="contribution-cell"
                      data-active={selectedDate === day.date ? true : undefined}
                      data-date={day.date}
                      data-density={day.contribution?.level ?? 0}
                      data-index={index}
                      data-known={day.contribution ? true : undefined}
                      data-texture="dither"
                      disabled={!gridInteractive}
                      key={day.date}
                      onBlur={() => {
                        if (!pinnedDate) {
                          setFocusedDate((current) => current === day.date ? undefined : current);
                        }
                      }}
                      onClick={(event) => {
                        setRovingIndex(index);
                        pinDate(day.date, event.currentTarget, event.detail === 0);
                      }}
                      onFocus={() => {
                        setRovingIndex(index);
                        if (suppressRestoredFocusRef.current) return;
                        if (!pinnedDate) setFocusedDate(day.date);
                      }}
                      onKeyDown={(event) => moveCellFocus(event, index)}
                      onPointerEnter={(event) => {
                        if (event.pointerType !== "touch" && !pinnedDate) {
                          setHoveredDate(day.date);
                        }
                      }}
                      onPointerLeave={() => {
                        if (!pinnedDate) {
                          setHoveredDate((current) => current === day.date ? undefined : current);
                        }
                      }}
                      tabIndex={gridInteractive && index === tabStopIndex ? 0 : -1}
                      title={label}
                      type="button"
                    />
                  );
                })}
              </div>

              <label className="contribution-touch-picker">
                <span>Choose a day</span>
                <select
                  aria-controls={pinnedDate ? POPOVER_ID : undefined}
                  disabled={!graphAvailable}
                  ref={pickerRef}
                  value={pinnedDate ?? ""}
                  onChange={(event) => {
                    const nextDate = event.currentTarget.value || undefined;
                    if (nextDate) pinDate(nextDate, event.currentTarget, true);
                    else dismissPinnedDate(false);
                  }}
                >
                  <option value="">No day selected</option>
                  {[...calendar.filter((day) => day.date <= today)]
                    .reverse()
                    .map((day) => (
                      <option key={day.date} value={day.date}>
                        {formattedDate(day.date)} — {day.contribution?.count ?? "—"} contributions
                      </option>
                    ))}
                </select>
              </label>

              {pickerMode ? popoverPanel : null}

              <div className="contribution-meta" data-texture="dither">
                <div aria-label="Contribution density from quiet to active" className="contribution-legend" data-texture="dither">
                  <span>Quiet</span>
                  {[0, 1, 2, 3, 4].map((density) => (
                    <span aria-hidden="true" className="contribution-cell" data-density={density} key={density} />
                  ))}
                  <span>Active</span>
                </div>
                <p aria-live="polite">
                  {loadState === "loading" && "Loading the contribution calendar…"}
                  {loadState === "live" && `${payload?.totalContributions ?? 0} contributions in the reported calendar.`}
                  {loadState === "fallback" && "Live contribution data is unavailable; this empty grid contains no inferred counts."}
                </p>
                <div className="contribution-links">
                  <a href={`https://github.com/${USERNAME}`} rel="noreferrer" target="_blank">GitHub ↗</a>
                  <a href={`https://github.com/${USERNAME}?tab=repositories`} rel="noreferrer" target="_blank">Repositories ↗</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {popover}
    </>
  );
}
