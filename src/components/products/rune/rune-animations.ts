/**
 * Rune Animation Helpers
 * 
 * Named helper functions for all anime.js animations in RuneProductSection.
 * Each card/component type has dedicated entrance and loop animations.
 * 
 * Uses only performant properties: transform (translate, scale, rotate) and opacity.
 * Easings are premium/technical, not cartoonish.
 */

import { animate, stagger, createTimeline } from "animejs";

// ============================================================================
// EASING PRESETS
// ============================================================================

export const EASINGS = {
    // Premium entrance easings
    smoothOut: "easeOutQuad",
    snappyOut: "easeOutCubic",
    elasticOut: "easeOutElastic(1, 0.5)",
    springOut: "easeOutBack",

    // Loop/pulse easings
    gentle: "easeInOutSine",
    linear: "linear",
} as const;

// ============================================================================
// DURATION PRESETS
// ============================================================================

export const DURATIONS = {
    fast: 300,
    normal: 500,
    slow: 700,
    verySlow: 1000,
} as const;

// ============================================================================
// BOUTIQUE ORDER HUB CARD - Hero Card
// ============================================================================

/**
 * Main entrance animation for the hero hub card.
 * Scale from 0.9, translateY from 40px, opacity fade in.
 */
export function createHubCardEntrance(el: HTMLElement) {
    return animate(el, {
        scale: [0.9, 1],
        translateY: [40, 0],
        opacity: [0, 1],
        duration: DURATIONS.slow,
        easing: EASINGS.springOut,
    });
}

/**
 * Internal "boot" animation - border glow sweep after entrance.
 */
export function createHubBootAnimation(borderEl: HTMLElement) {
    return animate(borderEl, {
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        duration: 2000,
        easing: EASINGS.gentle,
        loop: true,
    });
}

/**
 * Order number flicker effect.
 */
export function createOrderNumberFlicker(el: HTMLElement) {
    return animate(el, {
        opacity: [1, 0.3, 1, 0.5, 1],
        duration: 600,
        easing: EASINGS.linear,
    });
}

// ============================================================================
// INTELLIGENT ROUTING CARD
// ============================================================================

/**
 * Cards snap in from left/right with slight Y rotation.
 */
export function createRoutingCardEntrance(el: HTMLElement, fromLeft: boolean = true) {
    return animate(el, {
        translateX: [fromLeft ? -60 : 60, 0],
        rotateY: [fromLeft ? -8 : 8, 0],
        opacity: [0, 1],
        duration: DURATIONS.normal,
        easing: EASINGS.snappyOut,
    });
}

/**
 * Pulsing border glow loop for routing cards.
 */
export function createRoutingPulseLoop(borderEl: HTMLElement) {
    return animate(borderEl, {
        opacity: [0.3, 0.8, 0.3],
        scale: [1, 1.02, 1],
        duration: 2500,
        easing: EASINGS.gentle,
        loop: true,
    });
}

// ============================================================================
// PARALLEL EXECUTION - NODE CHIPS
// ============================================================================

/**
 * Staggered entrance for integration node pills.
 * All pop in from center with scale + opacity.
 */
export function createNodeChipsEntrance(els: NodeListOf<Element> | HTMLElement[]) {
    return animate(els, {
        scale: [0.6, 1],
        opacity: [0, 1],
        translateY: [20, 0],
        duration: DURATIONS.normal,
        delay: stagger(80, { from: "center" }),
        easing: EASINGS.springOut,
    });
}

/**
 * Token burst animation - small particles moving between nodes.
 */
export function createTokenBurst(tokenEls: NodeListOf<Element> | HTMLElement[]) {
    return animate(tokenEls, {
        translateX: ["0%", "var(--token-dx)"],
        translateY: ["0%", "var(--token-dy)"],
        scale: [1, 0.5, 0],
        opacity: [1, 0.8, 0],
        duration: 1200,
        delay: stagger(150),
        easing: EASINGS.smoothOut,
        loop: true,
    });
}

// ============================================================================
// RUNTIME LOGS PANEL
// ============================================================================

/**
 * Panel slides up from below with opacity fade.
 */
export function createLogsPanelEntrance(el: HTMLElement) {
    return animate(el, {
        translateY: [60, 0],
        opacity: [0, 1],
        duration: DURATIONS.slow,
        easing: EASINGS.smoothOut,
    });
}

/**
 * Staggered log line entrance.
 */
export function createLogLinesEntrance(lines: NodeListOf<Element> | HTMLElement[]) {
    return animate(lines, {
        translateY: [15, 0],
        opacity: [0, 1],
        duration: DURATIONS.fast,
        delay: stagger(60),
        easing: EASINGS.snappyOut,
    });
}

// NOTE: KPI counter animation is handled directly in RuneLogsPanel
// using anime.js targets object pattern for better control.

// ============================================================================
// BUILDER / CTA CARD
// ============================================================================

/**
 * Parent card fade + scale entrance.
 */
export function createBuilderCardEntrance(el: HTMLElement) {
    return animate(el, {
        scale: [0.95, 1],
        opacity: [0, 1],
        duration: DURATIONS.normal,
        easing: EASINGS.smoothOut,
    });
}

/**
 * Builder nodes slide into place sequentially.
 */
export function createBuilderNodesEntrance(nodes: NodeListOf<Element> | HTMLElement[]) {
    return animate(nodes, {
        translateX: [-40, 0],
        translateY: [20, 0],
        opacity: [0, 1],
        duration: DURATIONS.normal,
        delay: stagger(120),
        easing: EASINGS.snappyOut,
    });
}

/**
 * Connection lines grow between nodes.
 */
export function createConnectionLinesGrow(lines: NodeListOf<Element> | HTMLElement[]) {
    return animate(lines, {
        scaleX: [0, 1],
        opacity: [0, 1],
        duration: DURATIONS.normal,
        delay: stagger(100),
        easing: EASINGS.smoothOut,
    });
}

/**
 * CTA button shimmer loop.
 */
export function createCtaShimmerLoop(shimmerEl: HTMLElement) {
    return animate(shimmerEl, {
        translateX: ["-100%", "200%"],
        duration: 2500,
        easing: EASINGS.linear,
        loop: true,
    });
}

// ============================================================================
// VOXEL GRID BACKGROUND
// ============================================================================

/**
 * Subtle shimmer wave passing through cube grid.
 */
export function createCubeGridShimmer(cubes: NodeListOf<Element> | HTMLElement[]) {
    return animate(cubes, {
        opacity: [0.2, 0.5, 0.2],
        scale: [1, 1.05, 1],
        duration: 4000,
        delay: stagger(50, { grid: [20, 15], from: "center" }),
        easing: EASINGS.gentle,
        loop: true,
    });
}

/**
 * Random "data ping" - single cube pops up and back.
 */
export function createCubePing(cube: HTMLElement) {
    return animate(cube, {
        translateY: [0, -8, 0],
        scale: [1, 1.2, 1],
        opacity: [0.3, 0.9, 0.3],
        duration: 800,
        easing: EASINGS.elasticOut,
    });
}

// ============================================================================
// GENERIC CARD ENTRANCE
// ============================================================================

/**
 * Standard card entrance for any Rune card.
 */
export function createCardEntrance(el: HTMLElement, delay: number = 0) {
    return animate(el, {
        translateY: [30, 0],
        opacity: [0, 1],
        scale: [0.98, 1],
        duration: DURATIONS.normal,
        delay,
        easing: EASINGS.snappyOut,
    });
}
