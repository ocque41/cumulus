export const GITHUB_CONTRIBUTION_USERNAME = "ocque41" as const;

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export type GithubActivityKind = "commit" | "issue" | "pull-request";

export interface GithubActivityHighlight {
  kind: GithubActivityKind;
  repository: string;
  title: string;
  url?: string;
}

export interface GithubActivityDay {
  commits: number | null;
  date: string;
  highlights: GithubActivityHighlight[];
  issues: number;
  pullRequests: number;
}

export interface GithubContributionsPayload {
  activityDays: GithubActivityDay[];
  activityDetailStatus: "live" | "unavailable";
  username: typeof GITHUB_CONTRIBUTION_USERNAME;
  contributions: ContributionDay[];
  totalContributions: number;
  fetchedAt: string;
}

export interface GithubContributionConfig {
  accessToken: string;
}
