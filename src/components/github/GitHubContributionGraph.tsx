import { useEffect, useMemo, useState } from "react";

const USERNAME = "ocque41";
const ENDPOINT = "/api/github/contributions";
const DAY = 86_400_000;
// GitHub renders 53 Sunday-to-Saturday columns. The final column can include
// future days, so the visual has 371 slots while the payload has observed days.
const WEEK_COUNT = 53;

interface Contribution {
  count: number;
  date: string;
  level: 0 | 1 | 2 | 3 | 4;
}

interface ContributionsResponse {
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
  const fallbackStart = new Date(
    end.getTime() - (WEEK_COUNT * 7 - 1) * DAY,
  );
  const earliestObservedDate = contributions.reduce<string | undefined>(
    (earliest, item) =>
      earliest === undefined || item.date < earliest ? item.date : earliest,
    undefined,
  );
  const earliestObserved = earliestObservedDate
    ? new Date(`${earliestObservedDate}T00:00:00.000Z`)
    : undefined;
  const start = earliestObserved
    ? new Date(
        earliestObserved.getTime() - earliestObserved.getUTCDay() * DAY,
      )
    : fallbackStart;
  const byDate = new Map(contributions.map((item) => [item.date, item]));

  return Array.from({ length: WEEK_COUNT * 7 }, (_, index) => {
    const date = dayKey(new Date(start.getTime() + index * DAY));
    return { contribution: byDate.get(date), date };
  });
}

function isContribution(value: unknown): value is Contribution {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.date === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(candidate.date) &&
    typeof candidate.count === "number" &&
    Number.isInteger(candidate.count) &&
    candidate.count >= 0 &&
    typeof candidate.level === "number" &&
    Number.isInteger(candidate.level) &&
    candidate.level >= 0 &&
    candidate.level <= 4
  );
}

function parseResponse(value: unknown): ContributionsResponse {
  if (!value || typeof value !== "object") throw new Error("Invalid response");
  const candidate = value as Record<string, unknown>;

  if (
    candidate.username !== USERNAME ||
    !Array.isArray(candidate.contributions) ||
    !candidate.contributions.every(isContribution) ||
    typeof candidate.totalContributions !== "number" ||
    !Number.isInteger(candidate.totalContributions) ||
    candidate.totalContributions < 0 ||
    typeof candidate.fetchedAt !== "string" ||
    Number.isNaN(Date.parse(candidate.fetchedAt))
  ) {
    throw new Error("Invalid contribution payload");
  }

  return candidate as unknown as ContributionsResponse;
}

export function GitHubContributionGraph() {
  const [payload, setPayload] = useState<ContributionsResponse>();
  const [loadState, setLoadState] = useState<LoadState>("loading");

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
  const activeDays = payload?.contributions.filter((day) => day.count > 0).length ?? 0;

  return (
    <section aria-labelledby="github-title" className="github-panel" id="github">
      <div className="section-intro section-intro--split">
        <div>
          <p className="eyebrow">Open work / 001</p>
          <h2 id="github-title">ocque41, in public</h2>
        </div>
        <p>
          The GitHub contribution calendar, fetched through a same-origin server
          boundary. If that boundary is unavailable, the graph says so instead of
          inventing activity.
        </p>
      </div>

      <div className="contribution-frame" data-load-state={loadState}>
        <div
          aria-label={
            payload
              ? `${payload.totalContributions} GitHub contributions across ${activeDays} active day${activeDays === 1 ? "" : "s"} for ${USERNAME}.`
              : `The GitHub contribution graph for ${USERNAME} is currently unavailable. Use the profile link for the current record.`
          }
          className="contribution-grid"
          role="img"
        >
          {calendar.map((day) => (
            <span
              aria-hidden="true"
              className="contribution-cell"
              data-density={day.contribution?.level ?? 0}
              data-known={day.contribution ? true : undefined}
              key={day.date}
              title={
                day.contribution
                  ? `${day.date}: ${day.contribution.count} contribution${day.contribution.count === 1 ? "" : "s"}`
                  : `${day.date}: contribution data unavailable`
              }
            />
          ))}
        </div>

        <div aria-live="polite" className="contribution-status">
          <p>
            {loadState === "loading" && "Loading the contribution calendar…"}
            {loadState === "live" &&
              `${payload?.totalContributions ?? 0} contributions in the reported calendar.`}
            {loadState === "fallback" &&
              "Live contribution data is unavailable; this empty grid contains no inferred counts."}
          </p>
          {payload ? (
            <p>
              Observed {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(payload.fetchedAt))}
            </p>
          ) : null}
          <a href={`https://github.com/${USERNAME}`} rel="noreferrer" target="_blank">
            Open the complete GitHub profile
          </a>
        </div>
      </div>

      <div className="repository-strip" aria-label="Public GitHub links">
        <a href={`https://github.com/${USERNAME}`} rel="noreferrer" target="_blank">
          <span>01</span>
          <strong>Profile</strong>
          <small>Contribution history and current public work.</small>
        </a>
        <a
          href={`https://github.com/${USERNAME}?tab=repositories`}
          rel="noreferrer"
          target="_blank"
        >
          <span>02</span>
          <strong>Repositories</strong>
          <small>Browse the complete public repository index.</small>
        </a>
      </div>
    </section>
  );
}
