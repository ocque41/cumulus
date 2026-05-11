"use client";

import { useUiPreferences } from "@/components/providers/ui-preferences-provider";
import { NavigationRail } from "@/components/shell/NavigationRail";
import { Switch } from "@/components/ui/switch";

const MATERIAL_OPTIONS = ["subtle", "standard", "strong", "solid"] as const;
const ELEVATION_OPTIONS = ["e1", "e2", "e3", "e4"] as const;
const MOTION_OPTIONS = ["full", "reduced", "off"] as const;
const THEME_OPTIONS = ["system", "dark", "light"] as const;

export default function GlobalSettings() {
  const { preferences, updatePreferences } = useUiPreferences();

  return (
    <div className="relative mx-auto flex w-full max-w-[1600px] gap-8 px-4 py-8 md:px-8">
      <NavigationRail />
      <div className="flex-1 space-y-8 lg:pl-28">
        <h1 className="text-4xl font-bold tracking-tight text-[color:var(--glass-text-title)]">System Configuration</h1>

        <section className="glass-surface glass-standard glass-e3 rounded-[5.5px] p-6 md:p-8">
          <h2 className="mb-6 text-xl font-semibold text-[color:var(--glass-text-title)]">Liquid Glass Preferences</h2>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--glass-text-muted)]">Material</span>
              <select
                value={preferences.material}
                onChange={(event) => void updatePreferences({ material: event.target.value as (typeof MATERIAL_OPTIONS)[number] })}
                className="glass-surface glass-subtle glass-e1 h-11 w-full rounded-[5.5px] px-3 text-sm"
              >
                {MATERIAL_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[color:var(--bg)]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--glass-text-muted)]">Elevation</span>
              <select
                value={preferences.elevation}
                onChange={(event) => void updatePreferences({ elevation: event.target.value as (typeof ELEVATION_OPTIONS)[number] })}
                className="glass-surface glass-subtle glass-e1 h-11 w-full rounded-[5.5px] px-3 text-sm"
              >
                {ELEVATION_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[color:var(--bg)]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--glass-text-muted)]">Theme Mode</span>
              <select
                value={preferences.themeMode}
                onChange={(event) => void updatePreferences({ themeMode: event.target.value as (typeof THEME_OPTIONS)[number] })}
                className="glass-surface glass-subtle glass-e1 h-11 w-full rounded-[5.5px] px-3 text-sm"
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[color:var(--bg)]">
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--glass-text-muted)]">Motion Mode</span>
              <select
                value={preferences.motionMode}
                onChange={(event) => void updatePreferences({ motionMode: event.target.value as (typeof MOTION_OPTIONS)[number] })}
                className="glass-surface glass-subtle glass-e1 h-11 w-full rounded-[5.5px] px-3 text-sm"
              >
                {MOTION_OPTIONS.map((option) => (
                  <option key={option} value={option} className="bg-[color:var(--bg)]">
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-[5.5px] border border-[color:var(--glass-border-base)] bg-[color:var(--glass-bg-subtle)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[color:var(--glass-text-body)]">Reduce Transparency</p>
              <p className="text-xs text-[color:var(--glass-text-muted)]">Forces solid surfaces for readability/performance</p>
            </div>
            <Switch
              checked={preferences.reduceTransparency}
              onCheckedChange={(next) => void updatePreferences({ reduceTransparency: next })}
            />
          </div>
        </section>

        <section className="glass-surface glass-subtle glass-e2 rounded-[5.5px] p-6 md:p-8">
          <h2 className="mb-3 text-xl font-semibold text-[color:var(--glass-text-title)]">Production Overlay Controls</h2>
          <p className="max-w-2xl text-sm leading-7 text-[color:var(--glass-text-muted)]">
            Global maintenance switches, provider controls, and admin systems belong in the private production overlay. The public build keeps this page focused on personal UI preferences.
          </p>
        </section>
      </div>
    </div>
  );
}
