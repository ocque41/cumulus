export type ProfileTier = "free" | "pro" | "enterprise";

export type ProfileRecord = {
  full_name: string | null;
  tier: ProfileTier | null;
  subscription_status: string | null;
};

export type DomeProfile = {
  fullName: string;
  tier: ProfileTier;
  subscriptionStatus: string | null;
};

export const defaultDomeProfile: DomeProfile = {
  fullName: "",
  tier: "free",
  subscriptionStatus: null,
};

export function resolveDomeProfile(record?: ProfileRecord | null): DomeProfile {
  if (!record) {
    return defaultDomeProfile;
  }

  return {
    fullName: record.full_name ?? "",
    tier: record.tier ?? "free",
    subscriptionStatus: record.subscription_status,
  };
}

export function getProfileSubscriptionLabel(
  profile: Pick<DomeProfile, "tier" | "subscriptionStatus">
): string {
  if (profile.subscriptionStatus) {
    return profile.subscriptionStatus;
  }

  return profile.tier === "free" ? "free" : "unavailable";
}
