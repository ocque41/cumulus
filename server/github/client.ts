import {
  GITHUB_CONTRIBUTION_USERNAME,
  type ContributionDay,
  type ContributionLevel,
  type GithubContributionsPayload,
} from "./types.js";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";
const MAXIMUM_UPSTREAM_BYTES = 256 * 1024;
const MINIMUM_CALENDAR_WEEKS = 52;
const MAXIMUM_CALENDAR_WEEKS = 53;
const MINIMUM_CALENDAR_DAYS = 364;
const MAXIMUM_CALENDAR_DAYS = 371;
const DEFAULT_TIMEOUT_MS = 8_000;

// GitHub's GraphQL contributionCalendar is the authoritative source for the
// public profile graph. The login is intentionally a literal, not a request
// variable, so this server endpoint cannot become an arbitrary GitHub proxy.
export const GITHUB_CONTRIBUTION_QUERY = `
  query CumulusContributionCalendar {
    user(login: "ocque41") {
      login
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            firstDay
            contributionDays {
              contributionCount
              contributionLevel
              date
              weekday
            }
          }
        }
      }
    }
  }
`;

export class GithubContributionUpstreamError extends Error {
  readonly code:
    | "github_network_error"
    | "github_http_error"
    | "github_response_too_large"
    | "github_invalid_response";

  constructor(code: GithubContributionUpstreamError["code"]) {
    super(code);
    this.name = "GithubContributionUpstreamError";
    this.code = code;
  }
}

interface FetchGithubContributionCalendarOptions {
  accessToken: string;
  fetcher?: typeof fetch;
  now?: () => Date;
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isCanonicalDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(timestamp)
    && new Date(timestamp).toISOString().slice(0, 10) === value
  );
}

function contributionLevel(value: unknown): ContributionLevel | undefined {
  switch (value) {
    case "NONE":
      return 0;
    case "FIRST_QUARTILE":
      return 1;
    case "SECOND_QUARTILE":
      return 2;
    case "THIRD_QUARTILE":
      return 3;
    case "FOURTH_QUARTILE":
      return 4;
    default:
      return undefined;
  }
}

function parseCalendar(
  value: unknown,
  fetchedAt: string,
): GithubContributionsPayload {
  if (!isRecord(value)) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  if (
    "errors" in value
    && (!Array.isArray(value.errors) || value.errors.length > 0)
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  const data = value.data;
  const user = isRecord(data) ? data.user : undefined;
  const collection = isRecord(user) ? user.contributionsCollection : undefined;
  const calendar = isRecord(collection)
    ? collection.contributionCalendar
    : undefined;

  if (
    !isRecord(user)
    || typeof user.login !== "string"
    || user.login.toLowerCase() !== GITHUB_CONTRIBUTION_USERNAME
    || !isRecord(calendar)
    || !isSafeCount(calendar.totalContributions)
    || !Array.isArray(calendar.weeks)
    || calendar.weeks.length < MINIMUM_CALENDAR_WEEKS
    || calendar.weeks.length > MAXIMUM_CALENDAR_WEEKS
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  const contributions: ContributionDay[] = [];
  let previousTimestamp: number | undefined;
  let countedContributions = 0;

  for (const week of calendar.weeks) {
    if (
      !isRecord(week)
      || !isCanonicalDate(week.firstDay)
      || !Array.isArray(week.contributionDays)
      || week.contributionDays.length < 1
      || week.contributionDays.length > 7
    ) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }

    let firstDate: string | undefined;
    const weekdays = new Set<number>();
    for (const day of week.contributionDays) {
      if (
        !isRecord(day)
        || !isCanonicalDate(day.date)
        || !isSafeCount(day.contributionCount)
        || !Number.isInteger(day.weekday)
        || (day.weekday as number) < 0
        || (day.weekday as number) > 6
      ) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }

      const level = contributionLevel(day.contributionLevel);
      const timestamp = Date.parse(`${day.date}T00:00:00.000Z`);
      if (
        level === undefined
        || weekdays.has(day.weekday as number)
        || new Date(timestamp).getUTCDay() !== day.weekday
        || (previousTimestamp !== undefined
          && timestamp - previousTimestamp !== 86_400_000)
      ) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }

      firstDate ??= day.date;
      weekdays.add(day.weekday as number);
      previousTimestamp = timestamp;
      countedContributions += day.contributionCount;
      if (!Number.isSafeInteger(countedContributions)) {
        throw new GithubContributionUpstreamError("github_invalid_response");
      }
      contributions.push({
        date: day.date,
        count: day.contributionCount,
        level,
      });
    }

    if (week.firstDay !== firstDate) {
      throw new GithubContributionUpstreamError("github_invalid_response");
    }
  }

  if (
    contributions.length < MINIMUM_CALENDAR_DAYS
    || contributions.length > MAXIMUM_CALENDAR_DAYS
    || countedContributions !== calendar.totalContributions
  ) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }

  return {
    username: GITHUB_CONTRIBUTION_USERNAME,
    contributions,
    totalContributions: calendar.totalContributions,
    fetchedAt,
  };
}

async function readBoundedJson(response: Response): Promise<unknown> {
  const contentLength = response.headers.get("content-length");
  if (contentLength !== null) {
    const parsedLength = Number(contentLength);
    if (
      Number.isFinite(parsedLength)
      && parsedLength > MAXIMUM_UPSTREAM_BYTES
    ) {
      throw new GithubContributionUpstreamError(
        "github_response_too_large",
      );
    }
  }

  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }
  if (new TextEncoder().encode(text).byteLength > MAXIMUM_UPSTREAM_BYTES) {
    throw new GithubContributionUpstreamError("github_response_too_large");
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }
}

export async function fetchGithubContributionCalendar(
  options: FetchGithubContributionCalendarOptions,
): Promise<GithubContributionsPayload> {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const now = options.now ?? (() => new Date());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetcher(GITHUB_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.accessToken}`,
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "cumulus-contribution-calendar",
      },
      body: JSON.stringify({ query: GITHUB_CONTRIBUTION_QUERY }),
      signal: controller.signal,
    });
  } catch {
    throw new GithubContributionUpstreamError("github_network_error");
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw new GithubContributionUpstreamError("github_http_error");
  }

  const fetchedAt = now();
  if (Number.isNaN(fetchedAt.getTime())) {
    throw new GithubContributionUpstreamError("github_invalid_response");
  }
  const value = await readBoundedJson(response);
  return parseCalendar(value, fetchedAt.toISOString());
}
