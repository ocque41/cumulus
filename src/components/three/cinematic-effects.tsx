"use client";

import { useMemo, useEffect, useState } from "react";
// Post-processing effects require @react-three/postprocessing to be installed
// Uncomment these imports after running: npm install @react-three/postprocessing
// import { 
//   EffectComposer, 
//   Bloom, 
//   DepthOfField, 
//   Noise, 
//   Vignette,
//   ChromaticAberration 
// } from "@react-three/postprocessing";
// import { BlendFunction, KernelSize } from "postprocessing";

export type QualityPreset = "ultra" | "high" | "medium" | "low" | "minimal";

interface CinematicEffectsProps {
    /** Quality preset - affects performance */
    quality?: QualityPreset;
    /** Enable bloom glow effect */
    bloom?: boolean;
    /** Enable depth of field */
    depthOfField?: boolean;
    /** Enable film grain noise */
    noise?: boolean;
    /** Enable vignette */
    vignette?: boolean;
    /** Enable chromatic aberration (color fringing) */
    chromaticAberration?: boolean;
}

// Quality preset configurations
const qualitySettings: Record<QualityPreset, {
    enabled: boolean;
    bloomIntensity: number;
    dofBokehScale: number;
    noiseOpacity: number;
    resolutionScale: number;
}> = {
    ultra: {
        enabled: true,
        bloomIntensity: 0.8,
        dofBokehScale: 6,
        noiseOpacity: 0.03,
        resolutionScale: 1,
    },
    high: {
        enabled: true,
        bloomIntensity: 0.6,
        dofBokehScale: 4,
        noiseOpacity: 0.025,
        resolutionScale: 0.9,
    },
    medium: {
        enabled: true,
        bloomIntensity: 0.4,
        dofBokehScale: 3,
        noiseOpacity: 0.02,
        resolutionScale: 0.75,
    },
    low: {
        enabled: true,
        bloomIntensity: 0.3,
        dofBokehScale: 2,
        noiseOpacity: 0.015,
        resolutionScale: 0.5,
    },
    minimal: {
        enabled: false,
        bloomIntensity: 0,
        dofBokehScale: 0,
        noiseOpacity: 0,
        resolutionScale: 0.5,
    },
};

/**
 * Cinematic post-processing effects for the Antigravity engine.
 * 
 * NOTE: This component requires @react-three/postprocessing to be installed.
 * Install with: npm install @react-three/postprocessing
 * 
 * Features:
 * - Bloom for neon glow effects
 * - Depth of Field for "macro photography" blur
 * - Film grain noise for analog texture
 * - Vignette for cinematic framing
 * - Chromatic aberration for sci-fi color fringing
 * 
 * Respects prefers-reduced-motion and auto-detects device capabilities.
 */
export function CinematicEffects({
    quality = "high",
    bloom = true,
    depthOfField = false,
    noise = true,
    vignette = true,
    chromaticAberration = false,
}: CinematicEffectsProps) {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(query.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        query.addEventListener("change", handler);
        return () => query.removeEventListener("change", handler);
    }, []);

    const settings = useMemo(() => qualitySettings[quality], [quality]);

    // Disable all effects for minimal quality or reduced motion
    if (!settings.enabled || prefersReducedMotion) {
        return null;
    }

    // Post-processing not yet installed - return null
    // After installing @react-three/postprocessing, uncomment the EffectComposer below
    console.warn('CinematicEffects: @react-three/postprocessing not installed. Run: npm install @react-three/postprocessing');
    return null;

    // Uncomment after installing @react-three/postprocessing:
    /*
    return (
      <EffectComposer multisampling={quality === "ultra" ? 4 : 0}>
        {bloom && (
          <Bloom
            intensity={settings.bloomIntensity}
            luminanceThreshold={0.7}
            luminanceSmoothing={0.9}
            mipmapBlur
          />
        )}
        {depthOfField && (
          <DepthOfField
            focusDistance={0.01}
            focalLength={0.025}
            bokehScale={settings.dofBokehScale}
          />
        )}
        {vignette && (
          <Vignette
            offset={0.3}
            darkness={0.6}
          />
        )}
        {noise && (
          <Noise
            opacity={settings.noiseOpacity}
          />
        )}
      </EffectComposer>
    );
    */
}

/**
 * Hook to detect optimal quality preset based on device capabilities.
 */
export function useQualityPreset(): QualityPreset {
    const [preset, setPreset] = useState<QualityPreset>("medium");

    useEffect(() => {
        if (typeof window === "undefined") return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setPreset("minimal");
            return;
        }

        const dpr = window.devicePixelRatio || 1;
        const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
        const cores = navigator.hardwareConcurrency || 2;

        if (isMobile) {
            setPreset(cores >= 6 ? "medium" : "low");
        } else if (dpr > 2) {
            setPreset(cores >= 8 ? "high" : "medium");
        } else if (cores >= 8) {
            setPreset("ultra");
        } else if (cores >= 4) {
            setPreset("high");
        } else {
            setPreset("medium");
        }
    }, []);

    return preset;
}
