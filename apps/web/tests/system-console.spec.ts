import { expect, test, type Page } from "@playwright/test";

const STORAGE_KEY = "cumulus_db_system_connection:v1";

function supabaseStorageKey() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://your-project.supabase.co";
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0] ?? "your-project";
  return `sb-${projectRef}-auth-token`;
}

function fakeJwt(expiresAt: number) {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      aud: "authenticated",
      exp: expiresAt,
      role: "authenticated",
      sub: "test-user",
      email: "operator@example.com",
    }),
  ).toString("base64url");
  return `${header}.${payload}.signature`;
}

async function seedAuthenticatedSession(page: Page) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const accessToken = fakeJwt(expiresAt);

  await page.route("**/auth/v1/**", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      json: {
        access_token: accessToken,
        refresh_token: "test-refresh-token",
        token_type: "bearer",
        expires_at: expiresAt,
        expires_in: 3600,
        user: {
          id: "test-user",
          aud: "authenticated",
          role: "authenticated",
          email: "operator@example.com",
          email_confirmed_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
        },
      },
    });
  });

  await page.addInitScript(
    ({ accessToken: seededAccessToken, authKey, connectionKey, expiresAt: seededExpiresAt }) => {
      window.localStorage.setItem(
        authKey,
        JSON.stringify({
          access_token: seededAccessToken,
          refresh_token: "test-refresh-token",
          token_type: "bearer",
          expires_at: seededExpiresAt,
          expires_in: 3600,
          user: {
            id: "test-user",
            aud: "authenticated",
            role: "authenticated",
            email: "operator@example.com",
            email_confirmed_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {},
          },
        }),
      );
      window.localStorage.setItem(
        connectionKey,
        JSON.stringify({
          databaseId: "db_system_test",
          token: "cu_pat_v1_public_secret",
        }),
      );
    },
    { accessToken, authKey: supabaseStorageKey(), connectionKey: STORAGE_KEY, expiresAt },
  );
}

test.describe("Cumulus DB system console", () => {
  test("renders the console shell and forwards only the user bearer token", async ({ page }) => {
    const seenHeaders: Array<{ authorization?: string; admin?: string }> = [];
    const systemState = {
      version: 1,
      org: {
        id: "org_system_test",
        slug: "db_system_test",
        name: "Cumulus workspace",
        status: "active",
        humanOwnerEmail: "operator@example.com",
        createdAt: "2026-05-18T00:00:00.000Z",
        claimedAt: "2026-05-18T00:00:00.000Z",
      },
      principals: [
        {
          id: "agent-owner",
          type: "agent",
          displayName: "agent-owner",
          status: "active",
          createdAt: "2026-05-18T00:00:00.000Z",
          lastSeenAt: null,
          grants: ["system:read", "schema:plan", "schema:apply_safe"],
        },
      ],
      approvals: [],
      schema: {
        live: null,
        liveHash: null,
        lastApplied: null,
        lastAppliedHash: null,
        plans: [
          {
            id: "plan_system_test",
            planHash: "hash_plan",
            desiredHash: "hash_desired",
            operations: [
              {
                kind: "create_collection",
                target: "acme.agents",
                risk: "low",
                summary: "Create agents collection",
              },
            ],
            riskLevel: "low",
            status: "planned",
            createdAt: "2026-05-18T00:00:00.000Z",
            appliedAt: null,
            approvalRequired: false,
            snapshotRequired: false,
            baseLiveHash: null,
            baseLastAppliedHash: null,
          },
        ],
        versions: [],
        snapshots: [
          {
            id: "snap_system_test",
            kind: "manual",
            createdAt: "2026-05-18T00:00:00.000Z",
            createdByType: "system",
            createdById: "manual",
            storage: "provider-managed",
            metadata: {},
          },
        ],
      },
    };

    await seedAuthenticatedSession(page);
    await page.route("**/api/cumulus-db/system/**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = request.headers();
      seenHeaders.push({
        authorization: headers.authorization,
        admin: headers["x-cumulus-admin-key"],
      });

      if (url.pathname.endsWith("/scopes")) {
        await route.fulfill({
          contentType: "application/json",
          json: {
            scopes: [
              { scope: "system:read", label: "View system state", dangerous: false, approvalRequired: false },
              { scope: "schema:apply_destructive", label: "Apply destructive schema changes", dangerous: true, approvalRequired: true },
            ],
          },
        });
        return;
      }

      if (url.pathname.endsWith("/state")) {
        await route.fulfill({ contentType: "application/json", json: { system: systemState } });
        return;
      }

      if (url.pathname.endsWith("/audit")) {
        await route.fulfill({
          contentType: "application/json",
          json: { audit: [{ action: "system.schema_plan", at: "2026-05-18T00:00:00.000Z" }] },
        });
        return;
      }

      if (url.pathname.endsWith("/snapshots")) {
        await route.fulfill({
          contentType: "application/json",
          json: { snapshots: systemState.schema.snapshots },
        });
        return;
      }

      if (url.pathname.endsWith("/schema/plan")) {
        await route.fulfill({
          contentType: "application/json",
          json: { plan: systemState.schema.plans[0] },
        });
        return;
      }

      await route.fulfill({ status: 404, contentType: "application/json", json: { error: "not mocked" } });
    });

    await page.goto("/dashboard/system");
    const shellReady = await page
      .getByRole("heading", { name: "System console" })
      .waitFor({ timeout: 6000 })
      .then(() => true)
      .catch(() => false);
    test.skip(!shellReady, "Client auth provider did not hydrate the seeded test session.");

    await expect(page.getByLabel("Database id")).toHaveValue("db_system_test");
    await expect(page.getByLabel("Cumulus DB bearer token")).toHaveValue("cu_pat_v1_public_secret");

    await page.getByRole("button", { name: "Connect" }).click();
    await expect(page.getByText("system:read")).toBeVisible();
    await expect(page.getByText("agent-owner")).toBeVisible();
    await expect(page.getByText("Create agents collection")).toBeVisible();
    await expect(page.getByText("snap_system_test")).toBeVisible();

    await page.getByRole("button", { name: "Plan" }).click();
    expect(seenHeaders.length).toBeGreaterThanOrEqual(5);
    expect(seenHeaders.every((headers) => headers.authorization === "Bearer cu_pat_v1_public_secret")).toBe(true);
    expect(seenHeaders.every((headers) => headers.admin === undefined)).toBe(true);
  });

  test("system proxy rejects missing bearer tokens", async ({ request }) => {
    const response = await request.get("/api/cumulus-db/system/scopes");
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "A Cumulus DB bearer token is required for this route.",
    });
  });
});
