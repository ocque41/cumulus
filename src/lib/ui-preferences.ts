import type { UiPreferencePatch, UiPreferences, UiThemeProfile, UiUserPreferences } from "@/types/ui-preferences";

export const DEFAULT_PRODUCT_KEY = "hub";

export const DEFAULT_UI_THEME_PROFILE: Omit<UiThemeProfile, "productKey"> = {
  material: "standard",
  elevation: "e2",
  themeMode: "system",
  motionMode: "full",
  reduceTransparency: false,
  glassIntensity: 1,
  noiseOpacity: 0.05,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function resolveDomThemeMode(themeMode: UiThemeProfile["themeMode"], prefersLight = false): "dark" | "light" {
  if (themeMode === "light" || themeMode === "dark") return themeMode;
  return prefersLight ? "light" : "dark";
}

export function sanitizeUiPatch(input: UiPreferencePatch): UiPreferencePatch {
  const patch: UiPreferencePatch = {};

  if (input.productKey && input.productKey.trim().length > 0) {
    patch.productKey = input.productKey.trim().toLowerCase();
  }

  if (input.material) patch.material = input.material;
  if (input.elevation) patch.elevation = input.elevation;
  if (input.themeMode) patch.themeMode = input.themeMode;
  if (input.motionMode) patch.motionMode = input.motionMode;
  if (typeof input.reduceTransparency === "boolean") patch.reduceTransparency = input.reduceTransparency;
  if (typeof input.glassIntensity === "number") patch.glassIntensity = clamp(input.glassIntensity, 0.7, 1.3);
  if (typeof input.noiseOpacity === "number") patch.noiseOpacity = clamp(input.noiseOpacity, 0, 0.4);

  return patch;
}

export function makeFallbackTheme(productKey: string): UiThemeProfile {
  return {
    productKey,
    ...DEFAULT_UI_THEME_PROFILE,
  };
}

export function resolveUiPreferences(
  productKey: string,
  themeProfile: Partial<UiThemeProfile> | null,
  userPreferences: UiUserPreferences | null
): UiPreferences {
  const base = makeFallbackTheme(productKey);
  const resolved: UiThemeProfile = {
    productKey,
    material: userPreferences?.material ?? themeProfile?.material ?? base.material,
    elevation: userPreferences?.elevation ?? themeProfile?.elevation ?? base.elevation,
    themeMode: userPreferences?.themeMode ?? themeProfile?.themeMode ?? base.themeMode,
    motionMode: userPreferences?.motionMode ?? themeProfile?.motionMode ?? base.motionMode,
    reduceTransparency:
      typeof userPreferences?.reduceTransparency === "boolean"
        ? userPreferences.reduceTransparency
        : typeof themeProfile?.reduceTransparency === "boolean"
          ? themeProfile.reduceTransparency
          : base.reduceTransparency,
    glassIntensity:
      typeof userPreferences?.glassIntensity === "number"
        ? userPreferences.glassIntensity
        : typeof themeProfile?.glassIntensity === "number"
          ? themeProfile.glassIntensity
          : base.glassIntensity,
    noiseOpacity:
      typeof userPreferences?.noiseOpacity === "number"
        ? userPreferences.noiseOpacity
        : typeof themeProfile?.noiseOpacity === "number"
          ? themeProfile.noiseOpacity
          : base.noiseOpacity,
  };

  return {
    ...resolved,
    source: userPreferences ? "user" : "theme",
  };
}
