import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { HeroDither } from "@/components/visual/HeroDither";

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
  const [activeDate, setActiveDate] = useState<string>();
  const [pinnedDate, setPinnedDate] = useState<string>();
  const frameRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

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
    return () => controller.abort();
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
  const selectedDay = activeDate
    ? calendar.find((day) => day.date === activeDate)
    : undefined;
  const selectedActivity = activeDate ? activityByDate.get(activeDate) : undefined;
  const today = dayKey(new Date());
  const initialTabIndex = useMemo(
    () => calendar.reduce(
      (latest, day, index) => (day.date <= today ? index : latest),
      0,
    ),
    [calendar, today],
  );

  const moveFrame = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
    const normalizedX = x / Math.max(rect.width, 1) - 0.5;
    const normalizedY = y / Math.max(rect.height, 1) - 0.5;
    event.currentTarget.style.setProperty("--graph-rotate-x", `${normalizedY * -5}deg`);
    event.currentTarget.style.setProperty("--graph-rotate-y", `${normalizedX * 7}deg`);
    event.currentTarget.style.setProperty("--graph-shift-x", `${normalizedX * 6}px`);
    event.currentTarget.style.setProperty("--graph-shift-y", `${normalizedY * 5}px`);
    event.currentTarget.style.setProperty("--popover-x", `${(x / Math.max(rect.width, 1)) * 100}%`);
    event.currentTarget.style.setProperty("--popover-y", `${(y / Math.max(rect.height, 1)) * 100}%`);
  };

  const resetFrame = () => {
    const frame = frameRef.current;
    if (!frame) return;
    frame.style.setProperty("--graph-rotate-x", "0deg");
    frame.style.setProperty("--graph-rotate-y", "0deg");
    frame.style.setProperty("--graph-shift-x", "0px");
    frame.style.setProperty("--graph-shift-y", "0px");
    if (!pinnedDate) setActiveDate(undefined);
  };

  const moveCellFocus = (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
    const offsets: Record<string, number> = {
      ArrowDown: 1,
      ArrowLeft: -7,
      ArrowRight: 7,
      ArrowUp: -1,
    };
    if (event.key === "Escape") {
      setPinnedDate(undefined);
      setActiveDate(undefined);
      return;
    }
    const offset = offsets[event.key];
    if (!offset) return;
    event.preventDefault();
    const targetIndex = Math.max(0, Math.min(calendar.length - 1, index + offset));
    gridRef.current
      ?.querySelector<HTMLButtonElement>(`button[data-index="${targetIndex}"]`)
      ?.focus();
  };

  return (
    <section aria-labelledby="github-title" className="github-panel" id="github">
      <h2 className="visually-hidden" id="github-title">GitHub activity graph</h2>
      <div className="contribution-stage">
        <div
          className="contribution-frame"
          data-load-state={loadState}
          data-texture="dither"
          onPointerLeave={resetFrame}
          onPointerMove={moveFrame}
          ref={frameRef}
        >
          <HeroDither
            className="contribution-dither"
            fade
            fallbackClassName="contribution-dither__fallback"
            frame={841}
            maxPixelCount={520_000}
            shape="ripple"
            size={1.7}
            speed={0.12}
            type="8x8"
          />
          <div className="contribution-surface" data-texture="dither">
            <div className="contribution-heading">
              <span>CUMULUS / GITHUB</span>
              <strong>Activity field</strong>
              <small>Hover, focus, or tap a day</small>
            </div>
            <div
              aria-label={
                payload
                  ? `${payload.totalContributions} GitHub contributions across ${activeDays} active day${activeDays === 1 ? "" : "s"} in the reported calendar.`
                  : "The GitHub contribution graph is currently unavailable. Use the profile link for the current record."
              }
              className="contribution-grid"
              data-texture="dither"
              ref={gridRef}
              role="grid"
            >
              {calendar.map((day, index) => {
                const activity = activityByDate.get(day.date);
                const label = cellLabels[index] ?? cellLabel(day, activity);
                return (
                  <button
                    aria-label={label}
                    aria-selected={pinnedDate === day.date}
                    className="contribution-cell"
                    data-active={activeDate === day.date ? true : undefined}
                    data-density={day.contribution?.level ?? 0}
                    data-index={index}
                    data-known={day.contribution ? true : undefined}
                    data-texture="dither"
                    key={day.date}
                    onClick={() => {
                      const nextPinned = pinnedDate === day.date ? undefined : day.date;
                      setPinnedDate(nextPinned);
                      setActiveDate(nextPinned ?? day.date);
                    }}
                    onFocus={() => setActiveDate(day.date)}
                    onKeyDown={(event) => moveCellFocus(event, index)}
                    onPointerEnter={() => setActiveDate(day.date)}
                    role="gridcell"
                    tabIndex={index === initialTabIndex ? 0 : -1}
                    title={label}
                    type="button"
                  />
                );
              })}
            </div>

            {selectedDay ? (
              <aside aria-live="polite" className="contribution-popover" data-texture="dither">
                <p>CUMULUS / GITHUB SIGNAL</p>
                <h3>{formattedDate(selectedDay.date)}</h3>
                <div className="contribution-popover__metrics">
                  <span><strong>{selectedDay.contribution?.count ?? "—"}</strong> contributions</span>
                  <span><strong>{selectedActivity?.commits ?? "—"}</strong> commits</span>
                  <span><strong>{selectedActivity?.pullRequests ?? "—"}</strong> PRs</span>
                  <span><strong>{selectedActivity?.issues ?? "—"}</strong> issues</span>
                </div>
                {selectedActivity?.highlights.length ? (
                  <ul>
                    {selectedActivity.highlights.map((highlight, index) => (
                      <li key={`${highlight.kind}-${highlight.repository}-${index}`}>
                        <span>{highlight.kind.replace("pull-request", "PR")}</span>
                        {highlight.url ? (
                          <a href={highlight.url} rel="noreferrer" target="_blank">{highlight.title}</a>
                        ) : <strong>{highlight.title}</strong>}
                        <small>{highlight.repository}</small>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <small className="contribution-popover__note">
                    {payload?.activityDetailStatus === "live"
                      ? "No public commit, pull-request, or issue detail was reported for this day."
                      : "The aggregate count is verified; public item detail is unavailable for this day."}
                  </small>
                )}
              </aside>
            ) : null}

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
  );
}
