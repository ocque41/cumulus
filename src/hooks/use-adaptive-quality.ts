"use client";

import { useEffect, useState, useMemo, useCallback } from "react";

export type QualityLevel = "ultra" | "high" | "medium" | "low" | "minimal";

interface QualityConfig {
    /** Instance count multiplier (0-1) */
    instanceMultiplier: number;
    /** Pixel ratio limit */
    maxDpr: number;
    /** Enable post-processing effects */
    enableEffects: boolean;
    /** Enable shadows */
    enableShadows: boolean;
    /** Texture quality (0-1) */
    textureQuality: number;
    /** Enable antialiasing */
    antialias: boolean;
    /** Frame loop mode */
    frameloop: "always" | "demand";
}

const qualityConfigs: Record<QualityLevel, QualityConfig> = {
    ultra: {
        instanceMultiplier: 1,
        maxDpr: 2,
        enableEffects: true,
        enableShadows: true,
        textureQuality: 1,
        antialias: true,
        frameloop: "always",
    },
    high: {
        instanceMultiplier: 0.8,
        maxDpr: 1.5,
        enableEffects: true,
        enableShadows: true,
        textureQuality: 0.8,
        antialias: true,
        frameloop: "always",
    },
    medium: {
        instanceMultiplier: 0.5,
        maxDpr: 1,
        enableEffects: true,
        enableShadows: false,
        textureQuality: 0.6,
        antialias: false,
        frameloop: "always",
    },
    low: {
        instanceMultiplier: 0.3,
        maxDpr: 1,
        enableEffects: false,
        enableShadows: false,
        textureQuality: 0.4,
        antialias: false,
        frameloop: "demand",
    },
    minimal: {
        instanceMultiplier: 0.15,
        maxDpr: 0.75,
        enableEffects: false,
        enableShadows: false,
        textureQuality: 0.25,
        antialias: false,
        frameloop: "demand",
    },
};

interface DeviceCapabilities {
    cores: number;
    memory: number;
    gpu: string;
    isMobile: boolean;
    prefersReducedMotion: boolean;
    connectionType: string;
}

/**
 * Detect device capabilities for adaptive quality.
 */
function detectCapabilities(): DeviceCapabilities {
    if (typeof window === "undefined") {
        return {
            cores: 4,
            memory: 4,
            gpu: "unknown",
            isMobile: false,
            prefersReducedMotion: false,
            connectionType: "4g",
        };
    }

    const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { effectiveType?: string };
    };

    return {
        cores: navigator.hardwareConcurrency || 4,
        memory: nav.deviceMemory || 4,
        gpu: getGPUInfo(),
        isMobile: "ontouchstart" in window || navigator.maxTouchPoints > 0,
        prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        connectionType: nav.connection?.effectiveType || "4g",
    };
}

/**
 * Try to get GPU info from WebGL.
 */
function getGPUInfo(): string {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return "unknown";

        const debugInfo = (gl as WebGLRenderingContext).getExtension("WEBGL_debug_renderer_info");
        if (!debugInfo) return "unknown";

        return (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || "unknown";
    } catch {
        return "unknown";
    }
}

/**
 * Determine optimal quality level based on device capabilities.
 */
function determineQualityLevel(caps: DeviceCapabilities): QualityLevel {
    // Always minimal for reduced motion
    if (caps.prefersReducedMotion) {
        return "minimal";
    }

    // Score device capabilities
    let score = 0;

    // CPU cores
    if (caps.cores >= 8) score += 3;
    else if (caps.cores >= 4) score += 2;
    else if (caps.cores >= 2) score += 1;

    // Memory
    if (caps.memory >= 8) score += 3;
    else if (caps.memory >= 4) score += 2;
    else if (caps.memory >= 2) score += 1;

    // GPU (basic heuristics)
    const gpu = caps.gpu.toLowerCase();
    if (gpu.includes("nvidia") || gpu.includes("amd") || gpu.includes("radeon")) {
        score += 3;
    } else if (gpu.includes("intel") && !gpu.includes("uhd")) {
        score += 2;
    } else if (gpu.includes("apple")) {
        score += 2;
    }

    // Mobile penalty
    if (caps.isMobile) {
        score = Math.max(0, score - 2);
    }

    // Connection penalty
    if (caps.connectionType === "slow-2g" || caps.connectionType === "2g") {
        score = Math.max(0, score - 2);
    } else if (caps.connectionType === "3g") {
        score = Math.max(0, score - 1);
    }

    // Map score to quality level
    if (score >= 8) return "ultra";
    if (score >= 6) return "high";
    if (score >= 4) return "medium";
    if (score >= 2) return "low";
    return "minimal";
}

/**
 * Hook to get adaptive quality preset based on device capabilities.
 * 
 * Features:
 * - Auto-detects GPU, CPU, memory
 * - Respects prefers-reduced-motion
 * - Considers network connection
 * - Returns config for R3F Canvas and effects
 */
export function useAdaptiveQuality() {
    const [level, setLevel] = useState<QualityLevel>("medium");
    const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null);

    useEffect(() => {
        const caps = detectCapabilities();
        setCapabilities(caps);
        setLevel(determineQualityLevel(caps));

        // Listen for reduced motion changes
        const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
        const handleChange = () => {
            const newCaps = detectCapabilities();
            setCapabilities(newCaps);
            setLevel(determineQualityLevel(newCaps));
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const config = useMemo(() => qualityConfigs[level], [level]);

    const setQuality = useCallback((newLevel: QualityLevel) => {
        setLevel(newLevel);
    }, []);

    return {
        level,
        config,
        capabilities,
        setQuality,
        isReducedMotion: capabilities?.prefersReducedMotion ?? false,
    };
}

/**
 * Reduced motion wrapper that returns fallback content when motion is reduced.
 */
export function useReducedMotion(): boolean {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(true); // Default to true for SSR safety

    useEffect(() => {
        if (typeof window === "undefined") return;

        const query = window.matchMedia("(prefers-reduced-motion: reduce)");
        setPrefersReducedMotion(query.matches);

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        query.addEventListener("change", handler);
        return () => query.removeEventListener("change", handler);
    }, []);

    return prefersReducedMotion;
}

/**
 * Higher-order component props for reduced motion.
 */
export interface WithReducedMotionProps {
    prefersReducedMotion: boolean;
}

/**
 * Calculate instance count based on quality level.
 */
export function getAdaptiveInstanceCount(baseCount: number, level: QualityLevel): number {
    const config = qualityConfigs[level];
    return Math.floor(baseCount * config.instanceMultiplier);
}

/**
 * Get R3F Canvas props based on quality level.
 */
export function getCanvasProps(level: QualityLevel) {
    const config = qualityConfigs[level];

    return {
        dpr: [1, config.maxDpr] as [number, number],
        gl: {
            antialias: config.antialias,
            alpha: true,
            powerPreference: level === "ultra" ? "high-performance" as const : "default" as const,
        },
        frameloop: config.frameloop,
        performance: {
            min: level === "ultra" ? 0.75 : 0.5,
        },
    };
}
