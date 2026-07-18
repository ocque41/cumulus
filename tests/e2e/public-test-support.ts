import type { Page } from "@playwright/test";

const CONTRIBUTIONS_ENDPOINT = "**/api/github/contributions";

export const SESSION_ENDPOINT = "**/api/notifications/session";
export const NOTIFICATION_PROMPT_STORAGE_KEY =
  "cumulus.notificationPrompt.seen.v1";

export const PRIMARY_ACTIVITY_DATE = "2026-07-16";
export const PRIMARY_ACTIVITY_LABEL = "Thursday, July 16, 2026";
export const SECONDARY_ACTIVITY_DATE = "2025-07-13";
export const SECONDARY_ACTIVITY_LABEL = "Sunday, July 13, 2025";

export async function mockContributions(page: Page) {
  await page.route(CONTRIBUTIONS_ENDPOINT, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        username: "ocque41",
        activityDays: [
          {
            commits: 2,
            date: SECONDARY_ACTIVITY_DATE,
            highlights: [
              {
                kind: "commit",
                repository: "cumulus/cloud",
                title: "Establish the public activity boundary",
              },
            ],
            issues: 0,
            pullRequests: 0,
          },
          {
            commits: 4,
            date: PRIMARY_ACTIVITY_DATE,
            highlights: [
              {
                kind: "pull-request",
                repository: "cumulus/cloud",
                title: "Refine the hero activity field",
                url: "https://github.com/cumulus/cloud/pull/12",
              },
            ],
            issues: 1,
            pullRequests: 1,
          },
        ],
        activityDetailStatus: "live",
        contributions: [
          { count: 2, date: SECONDARY_ACTIVITY_DATE, level: 2 },
          { count: 4, date: PRIMARY_ACTIVITY_DATE, level: 3 },
        ],
        totalContributions: 6,
        fetchedAt: "2026-07-17T12:00:00.000Z",
      },
    });
  });
}

export async function mockAnonymousNotificationSession(page: Page) {
  await page.route(SESSION_ENDPOINT, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: { user: null },
      status: 200,
    });
  });
}

export async function seedNotificationPromptMarker(page: Page) {
  await page.addInitScript(
    ({ key, value }) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        window.sessionStorage.setItem(key, value);
      }
    },
    { key: NOTIFICATION_PROMPT_STORAGE_KEY, value: "1" },
  );
}
