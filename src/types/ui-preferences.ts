export const GLASS_MATERIALS = ["subtle", "standard", "strong", "solid"] as const;
export type GlassMaterial = (typeof GLASS_MATERIALS)[number];

export const GLASS_ELEVATIONS = ["e1", "e2", "e3", "e4"] as const;
export type GlassElevation = (typeof GLASS_ELEVATIONS)[number];

export const UI_THEME_MODES = ["dark", "light", "system"] as const;
export type UiThemeMode = (typeof UI_THEME_MODES)[number];

export const UI_MOTION_MODES = ["full", "reduced", "off"] as const;
export type UiMotionMode = (typeof UI_MOTION_MODES)[number];

export type UiThemeProfile = {
  productKey: string;
  material: GlassMaterial;
  elevation: GlassElevation;
  themeMode: UiThemeMode;
  motionMode: UiMotionMode;
  reduceTransparency: boolean;
  glassIntensity: number;
  noiseOpacity: number;
};

export type UiUserPreferences = {
  productKey: string;
  userId: string;
  material?: GlassMaterial | null;
  elevation?: GlassElevation | null;
  themeMode?: UiThemeMode | null;
  motionMode?: UiMotionMode | null;
  reduceTransparency?: boolean | null;
  glassIntensity?: number | null;
  noiseOpacity?: number | null;
};

export type UiPreferences = UiThemeProfile & {
  source: "theme" | "user";
};

export type UiPreferencePatch = Partial<
  Pick<
    UiThemeProfile,
    "material" | "elevation" | "themeMode" | "motionMode" | "reduceTransparency" | "glassIntensity" | "noiseOpacity"
  >
> & {
  productKey?: string;
};
