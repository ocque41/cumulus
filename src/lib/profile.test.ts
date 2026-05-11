import { describe, expect, it } from "vitest";

import {
  defaultDomeProfile,
  getProfileSubscriptionLabel,
  resolveDomeProfile,
} from "@/lib/profile";

describe("profile helpers", () => {
  it("falls back to the default Tado profile when no row exists", () => {
    expect(resolveDomeProfile(null)).toEqual(defaultDomeProfile);
  });

  it("maps the profiles row into the client shape", () => {
    expect(
      resolveDomeProfile({
        full_name: "Miguel",
        tier: "pro",
        subscription_status: "active",
      })
    ).toEqual({
      fullName: "Miguel",
      tier: "pro",
      subscriptionStatus: "active",
    });
  });

  it("shows a free label when no subscription record exists", () => {
    expect(
      getProfileSubscriptionLabel({
        tier: "free",
        subscriptionStatus: null,
      })
    ).toBe("free");
  });

  it("marks paid accounts without a subscription state as unavailable", () => {
    expect(
      getProfileSubscriptionLabel({
        tier: "pro",
        subscriptionStatus: null,
      })
    ).toBe("unavailable");
  });
});
