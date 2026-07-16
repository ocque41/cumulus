import type { GithubContributionConfig } from "./types.js";

const MAXIMUM_TOKEN_LENGTH = 1024;

export class GithubContributionConfigurationError extends Error {
  readonly code = "github_contribution_configuration_error";

  constructor() {
    super("GitHub contribution configuration is incomplete or invalid.");
    this.name = "GithubContributionConfigurationError";
  }
}

export function readGithubContributionConfig(
  env: Record<string, string | undefined>,
): GithubContributionConfig {
  const accessToken = env.GITHUB_ACCESS_TOKEN;
  if (
    !accessToken
    || accessToken.length > MAXIMUM_TOKEN_LENGTH
    || /\s/.test(accessToken)
  ) {
    throw new GithubContributionConfigurationError();
  }

  return { accessToken };
}
