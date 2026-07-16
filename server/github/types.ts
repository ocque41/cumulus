export const GITHUB_CONTRIBUTION_USERNAME = "ocque41" as const;

export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface ContributionDay {
  date: string;
  count: number;
  level: ContributionLevel;
}

export interface GithubContributionsPayload {
  username: typeof GITHUB_CONTRIBUTION_USERNAME;
  contributions: ContributionDay[];
  totalContributions: number;
  fetchedAt: string;
}

export interface GithubContributionConfig {
  accessToken: string;
}
