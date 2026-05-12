"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_PRODUCT_KEY,
  makeFallbackTheme,
  resolveDomThemeMode,
  resolveUiPreferences,
  sanitizeUiPatch,
} from "@/lib/ui-preferences";
import type { UiPreferencePatch, UiPreferences } from "@/types/ui-preferences";

type UiPreferencesContextType = {
  productKey: string;
  preferences: UiPreferences;
  isLoading: boolean;
  updatePreferences: (patch: UiPreferencePatch) => Promise<void>;
  reloadPreferences: () => Promise<void>;
};

const UiPreferencesContext = createContext<UiPreferencesContextType | undefined>(undefined);

const isGlassEnabled = process.env.NEXT_PUBLIC_UI_GLASS_ENABLED !== "false";
const forceSolidFromEnv = process.env.NEXT_PUBLIC_UI_GLASS_FORCE_SOLID === "true";

function toStorageKey(productKey: string) {
  return `cumulus_ui_preferences:${productKey}`;
}

function applyDomPreferences(prefs: UiPreferences) {
  const root = document.documentElement;
  const forceSolid = forceSolidFromEnv;
  const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)").matches ?? false;

  root.dataset.liquidGlass = isGlassEnabled ? "on" : "off";
  root.dataset.reduceTransparency = forceSolid || prefs.reduceTransparency ? "true" : "false";
  root.dataset.glassMaterial = forceSolid ? "solid" : prefs.material;
  root.dataset.glassElevation = prefs.elevation;
  root.dataset.uiMotion = prefs.motionMode;

  root.setAttribute("data-theme", resolveDomThemeMode(prefs.themeMode, prefersLight));

  root.style.setProperty("--glass-intensity", String(prefs.glassIntensity));
  root.style.setProperty("--glass-noise-opacity", String(prefs.noiseOpacity));
}

export function UiPreferencesProvider({
  children,
  productKey = DEFAULT_PRODUCT_KEY,
}: {
  children: ReactNode;
  productKey?: string;
}) {
  const normalizedProductKey = productKey.trim().toLowerCase() || DEFAULT_PRODUCT_KEY;
  const [preferences, setPreferences] = useState<UiPreferences>(() =>
    resolveUiPreferences(normalizedProductKey, makeFallbackTheme(normalizedProductKey), null)
  );
  const [isLoading, setIsLoading] = useState(true);

  const persistLocal = useCallback(
    (next: UiPreferences) => {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(toStorageKey(normalizedProductKey), JSON.stringify(next));
    },
    [normalizedProductKey]
  );

  const fetchPreferences = useCallback(async () => {
    try {
      const response = await fetch(`/api/ui/preferences?productKey=${encodeURIComponent(normalizedProductKey)}`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) return;
      const payload = (await response.json()) as { preferences?: UiPreferences };
      if (!payload.preferences) return;

      setPreferences(payload.preferences);
      persistLocal(payload.preferences);
    } finally {
      setIsLoading(false);
    }
  }, [normalizedProductKey, persistLocal]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(toStorageKey(normalizedProductKey));
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as UiPreferences;
        setPreferences(parsed);
      } catch {
        // Ignore malformed local cache.
      }
    }
    void fetchPreferences();
  }, [fetchPreferences, normalizedProductKey]);

  useEffect(() => {
    applyDomPreferences(preferences);

    if (preferences.themeMode !== "system" || typeof window === "undefined") return;
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    if (!media) return;
    const syncSystemTheme = () => applyDomPreferences(preferences);
    media.addEventListener("change", syncSystemTheme);

    return () => media.removeEventListener("change", syncSystemTheme);
  }, [preferences]);

  const updatePreferences = useCallback(
    async (patchInput: UiPreferencePatch) => {
      const patch = sanitizeUiPatch({
        ...patchInput,
        productKey: normalizedProductKey,
      });

      const localResolved = resolveUiPreferences(normalizedProductKey, preferences, {
        userId: "local",
        productKey: normalizedProductKey,
        material: patch.material ?? null,
        elevation: patch.elevation ?? null,
        themeMode: patch.themeMode ?? null,
        motionMode: patch.motionMode ?? null,
        reduceTransparency: typeof patch.reduceTransparency === "boolean" ? patch.reduceTransparency : null,
        glassIntensity: typeof patch.glassIntensity === "number" ? patch.glassIntensity : null,
        noiseOpacity: typeof patch.noiseOpacity === "number" ? patch.noiseOpacity : null,
      });

      setPreferences(localResolved);
      persistLocal(localResolved);

      const response = await fetch("/api/ui/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(patch),
      });

      if (!response.ok) return;
      const payload = (await response.json()) as { preferences?: UiPreferences };
      if (!payload.preferences) return;
      setPreferences(payload.preferences);
      persistLocal(payload.preferences);
    },
    [normalizedProductKey, persistLocal, preferences]
  );

  const value = useMemo<UiPreferencesContextType>(
    () => ({
      productKey: normalizedProductKey,
      preferences,
      isLoading,
      updatePreferences,
      reloadPreferences: fetchPreferences,
    }),
    [fetchPreferences, isLoading, normalizedProductKey, preferences, updatePreferences]
  );

  return <UiPreferencesContext.Provider value={value}>{children}</UiPreferencesContext.Provider>;
}

export function useUiPreferences() {
  const context = useContext(UiPreferencesContext);
  if (!context) {
    throw new Error("useUiPreferences must be used inside UiPreferencesProvider");
  }
  return context;
}
