import { describe, expect, it } from "vitest";

import { createSupabaseBrowserSetup } from "./supabase";

describe("createSupabaseBrowserSetup", () => {
  it("returns an unavailable setup instead of throwing for missing config", () => {
    expect(
      createSupabaseBrowserSetup({
        NEXT_PUBLIC_SITE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_URL: undefined,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
      }),
    ).toEqual({
      client: null,
      callbackUrl: null,
      unavailableReason:
        "Notification sign-in is not configured for this deployment. The public logs remain available.",
    });
  });

  it("accepts HTTPS deployment URLs and a localhost development origin", () => {
    const setup = createSupabaseBrowserSetup({
      NEXT_PUBLIC_SITE_URL: "http://localhost:4173/some-ignored-path",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });

    expect(setup.client).not.toBeNull();
    expect(setup.callbackUrl).toBe("http://localhost:4173/auth/callback");
    expect(setup.unavailableReason).toBeNull();
  });

  it("rejects credentials and insecure remote callback origins", () => {
    const setup = createSupabaseBrowserSetup({
      NEXT_PUBLIC_SITE_URL: "http://example.com",
      NEXT_PUBLIC_SUPABASE_URL: "https://user:pass@example.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });

    expect(setup.client).toBeNull();
    expect(setup.callbackUrl).toBeNull();
  });
});
