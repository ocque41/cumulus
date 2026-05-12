import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { DEFAULT_PRODUCT_KEY, resolveUiPreferences, sanitizeUiPatch } from "@/lib/ui-preferences";
import { createServerSupabaseClient as createClient } from "@cumulus/auth/server";
import type { UiPreferencePatch, UiThemeProfile, UiUserPreferences } from "@/types/ui-preferences";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  productKey: z.string().trim().min(1).optional(),
  material: z.enum(["subtle", "standard", "strong", "solid"]).optional(),
  elevation: z.enum(["e1", "e2", "e3", "e4"]).optional(),
  themeMode: z.enum(["dark", "light", "system"]).optional(),
  motionMode: z.enum(["full", "reduced", "off"]).optional(),
  reduceTransparency: z.boolean().optional(),
  glassIntensity: z.number().min(0.7).max(1.3).optional(),
  noiseOpacity: z.number().min(0).max(0.4).optional(),
});

const TABLE_MISSING_CODE = "42P01";
const POSTGREST_TABLE_MISSING_CODE = "PGRST205";

type SupabaseQueryError = {
  code?: string | null;
  message?: string | null;
} | null;

function isMissingTableError(error: SupabaseQueryError) {
  if (!error) return false;
  const code = error.code ?? "";
  if (code === TABLE_MISSING_CODE || code === POSTGREST_TABLE_MISSING_CODE) return true;
  const message = (error.message ?? "").toLowerCase();
  return message.includes("could not find the table") || message.includes("schema cache");
}

function mapThemeRowToProfile(productKey: string, row: Record<string, unknown> | null): UiThemeProfile | null {
  if (!row) return null;
  return {
    productKey,
    material: row.material as UiThemeProfile["material"],
    elevation: row.elevation as UiThemeProfile["elevation"],
    themeMode: row.theme_mode as UiThemeProfile["themeMode"],
    motionMode: row.motion_mode as UiThemeProfile["motionMode"],
    reduceTransparency: Boolean(row.reduce_transparency),
    glassIntensity: Number(row.glass_intensity),
    noiseOpacity: Number(row.noise_opacity),
  };
}

function mapUserRowToPreferences(productKey: string, row: Record<string, unknown> | null): UiUserPreferences | null {
  if (!row) return null;
  return {
    productKey,
    userId: String(row.user_id),
    material: (row.material as UiUserPreferences["material"]) ?? null,
    elevation: (row.elevation as UiUserPreferences["elevation"]) ?? null,
    themeMode: (row.theme_mode as UiUserPreferences["themeMode"]) ?? null,
    motionMode: (row.motion_mode as UiUserPreferences["motionMode"]) ?? null,
    reduceTransparency:
      typeof row.reduce_transparency === "boolean" ? (row.reduce_transparency as boolean) : null,
    glassIntensity: typeof row.glass_intensity === "number" ? (row.glass_intensity as number) : null,
    noiseOpacity: typeof row.noise_opacity === "number" ? (row.noise_opacity as number) : null,
  };
}

function makeFallbackResponse(productKey: string) {
  const resolved = resolveUiPreferences(productKey, null, null);

  return NextResponse.json({
    productKey,
    preferences: resolved,
    usingFallbackTables: true,
  });
}

export async function GET(req: NextRequest) {
  const productKey = req.nextUrl.searchParams.get("productKey")?.trim().toLowerCase() || DEFAULT_PRODUCT_KEY;
  let supabase: Awaited<ReturnType<typeof createClient>>;

  try {
    supabase = await createClient();
  } catch {
    return makeFallbackResponse(productKey);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  const { data: themeRow, error: themeError } = await supabase
    .from("cumulus_ui_theme_profiles")
    .select("*")
    .eq("product_key", productKey)
    .maybeSingle();

  if (themeError && !isMissingTableError(themeError)) {
    return makeFallbackResponse(productKey);
  }

  let userRow: Record<string, unknown> | null = null;
  let userQueryError: SupabaseQueryError = null;
  if (user) {
    const { data, error } = await supabase
      .from("cumulus_ui_user_preferences")
      .select("*")
      .eq("user_id", user.id)
      .eq("product_key", productKey)
      .maybeSingle();

    if (error && !isMissingTableError(error)) {
      return makeFallbackResponse(productKey);
    }

    userQueryError = error;
    userRow = data as Record<string, unknown> | null;
  }

  const resolved = resolveUiPreferences(
    productKey,
    mapThemeRowToProfile(productKey, themeRow as Record<string, unknown> | null),
    mapUserRowToPreferences(productKey, userRow)
  );

  return NextResponse.json({
    productKey,
    preferences: resolved,
    usingFallbackTables: isMissingTableError(themeError) || isMissingTableError(userQueryError),
  });
}

export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid preferences payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const patch = sanitizeUiPatch(parsed.data as UiPreferencePatch);
  const productKey = patch.productKey || DEFAULT_PRODUCT_KEY;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = {
    user_id: user.id,
    product_key: productKey,
    material: patch.material ?? null,
    elevation: patch.elevation ?? null,
    theme_mode: patch.themeMode ?? null,
    motion_mode: patch.motionMode ?? null,
    reduce_transparency: typeof patch.reduceTransparency === "boolean" ? patch.reduceTransparency : null,
    glass_intensity: typeof patch.glassIntensity === "number" ? patch.glassIntensity : null,
    noise_opacity: typeof patch.noiseOpacity === "number" ? patch.noiseOpacity : null,
  };

  const { data: upserted, error: upsertError } = await supabase
    .from("cumulus_ui_user_preferences")
    .upsert(payload, { onConflict: "user_id,product_key" })
    .select("*")
    .single();

  if (upsertError) {
    const status = isMissingTableError(upsertError) ? 503 : 500;
    return NextResponse.json({ error: upsertError.message }, { status });
  }

  const { data: themeRow } = await supabase
    .from("cumulus_ui_theme_profiles")
    .select("*")
    .eq("product_key", productKey)
    .maybeSingle();

  const resolved = resolveUiPreferences(
    productKey,
    mapThemeRowToProfile(productKey, themeRow as Record<string, unknown> | null),
    mapUserRowToPreferences(productKey, upserted as unknown as Record<string, unknown>)
  );

  return NextResponse.json({
    productKey,
    preferences: resolved,
  });
}
