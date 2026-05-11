/**
 * Animation Configuration for Rune Product Section
 * 
 * Named constants for animation configs to keep timeline code clean
 * and enable easy tweaking per breakpoint.
 */

import type { Breakpoint } from "@/hooks";

// ============================================================================
// DURATION CONSTANTS
// ============================================================================

export const DURATIONS = {
    fast: 300,
    normal: 500,
    slow: 800,
    verySlow: 1200,
} as const;

// Scene durations in milliseconds (these map to scroll timeline segments)
export const SCENE_DURATIONS = {
    intro: 1500,      // Scene 0: System boot
    orderEntry: 1200, // Scene 1: Order enters
    routing: 1800,    // Scene 2: Routing brain
    parallel: 2000,   // Scene 3: Parallel automation
    logs: 1500,       // Scene 4: Logs + KPIs
    builder: 1200,    // Scene 5: Workflow builder
    cta: 800,         // Final CTA
} as const;

// Total timeline duration
export const TOTAL_DURATION = Object.values(SCENE_DURATIONS).reduce((a, b) => a + b, 0);

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

export const EASINGS = {
    // Entry animations (decelerating)
    smooth: "easeOutQuad",
    snappy: "easeOutCubic",
    elastic: "easeOutBack",
    bounce: "easeOutElastic",

    // Exit animations (accelerating)
    fadeOut: "easeInQuad",

    // Continuous/loop animations
    linear: "linear",
    gentle: "easeInOutSine",
} as const;

// ============================================================================
// STAGGER CONFIGURATIONS
// ============================================================================

export const STAGGER = {
    fast: 50,
    normal: 100,
    slow: 150,
    cascade: 200,
} as const;

// ============================================================================
// TRANSFORM VALUES
// ============================================================================

export const TRANSFORMS = {
    // Entry positions
    slideUp: { from: 30, to: 0 },
    slideDown: { from: -30, to: 0 },
    scaleIn: { from: 0.8, to: 1 },
    scaleOut: { from: 1.2, to: 1 },

    // Glow pulse
    glowPulse: { min: 0.6, max: 1 },
} as const;

// ============================================================================
// RESPONSIVE OVERRIDES
// ============================================================================

export function getBreakpointConfig(breakpoint: Breakpoint) {
    return {
        mobile: {
            particleCount: 3,
            nodeCount: 4,
            staggerDelay: STAGGER.slow,
            enableGrid: false,
            enableParticles: false,
        },
        tablet: {
            particleCount: 5,
            nodeCount: 5,
            staggerDelay: STAGGER.normal,
            enableGrid: true,
            enableParticles: true,
        },
        desktop: {
            particleCount: 8,
            nodeCount: 6,
            staggerDelay: STAGGER.normal,
            enableGrid: true,
            enableParticles: true,
        },
    }[breakpoint];
}

// ============================================================================
// REDUCED MOTION FALLBACK
// ============================================================================

export const REDUCED_MOTION_CONFIG = {
    // Use instant transitions
    duration: 0,
    // Simple opacity only
    properties: {
        opacity: [0, 1],
    },
    easing: "linear",
} as const;

// ============================================================================
// SCENE LABELS (for timeline navigation)
// ============================================================================

export const SCENE_LABELS = {
    intro: "intro",
    orderEntry: "order_entry",
    routing: "routing",
    parallelStart: "parallel_start",
    parallelComplete: "parallel_complete",
    logs: "logs",
    builder: "builder",
    cta: "cta",
} as const;

// ============================================================================
// CSS SELECTORS
// ============================================================================

export const SELECTORS = {
    // Scene containers
    sceneIntro: "[data-rune-scene='intro']",
    sceneOrder: "[data-rune-scene='order']",
    sceneRouting: "[data-rune-scene='routing']",
    sceneParallel: "[data-rune-scene='parallel']",
    sceneLogs: "[data-rune-scene='logs']",
    sceneBuilder: "[data-rune-scene='builder']",

    // Elements
    gridLines: "[data-rune-grid-line]",
    hubCard: "[data-rune-hub]",
    orderOrb: "[data-rune-order]",
    tracks: "[data-rune-track]",
    nodes: "[data-rune-node]",
    tokens: "[data-rune-token]",
    logLines: "[data-rune-log]",
    kpiCards: "[data-rune-kpi]",
    builderBlocks: "[data-rune-block]",
    connections: "[data-rune-connection]",
    ctaButton: "[data-rune-cta]",
} as const;
