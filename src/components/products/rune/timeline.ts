/**
 * Rune Product Timeline Initialization
 * 
 * Creates and configures the master anime.js timeline for the
 * scroll-driven Rune product section. Each scene has its own
 * attach function for modularity.
 */

import { createTimeline, stagger, type Timeline } from "animejs";
import {
    DURATIONS,
    SCENE_DURATIONS,
    EASINGS,
    STAGGER,
    TRANSFORMS,
    SCENE_LABELS,
    SELECTORS,
} from "./animation-config";

// Re-export Timeline type for external use
export type { Timeline } from "animejs";

// ============================================================================
// TIMELINE CREATION
// ============================================================================

/**
 * Main entry point for initializing the Rune product timeline.
 * Call this once after DOM is ready.
 * 
 * @param sectionRoot - The root element of the Rune section
 * @param reducedMotion - Whether to use reduced motion config
 * @returns The master timeline instance for scroll binding
 */
export function initRuneProductTimeline(
    sectionRoot: HTMLElement,
    reducedMotion: boolean = false
): Timeline {
    // Create master timeline with autoplay disabled (scroll controls it)
    const tl = createTimeline({
        autoplay: false,
        defaults: {
            duration: reducedMotion ? 0 : DURATIONS.normal,
        },
    });

    if (reducedMotion) {
        // Simplified timeline: just fade everything in at once
        attachReducedMotionScene(tl, sectionRoot);
    } else {
        // Full cinematic experience
        attachIntroScene(tl, sectionRoot);
        attachOrderScene(tl, sectionRoot);
        attachRoutingScene(tl, sectionRoot);
        attachParallelScene(tl, sectionRoot);
        attachLogsScene(tl, sectionRoot);
        attachBuilderScene(tl, sectionRoot);
    }

    return tl;
}

// ============================================================================
// SCENE 0: INTRO - SYSTEM BOOT
// ============================================================================

function attachIntroScene(tl: Timeline, root: HTMLElement): void {
    const gridLines = root.querySelectorAll(SELECTORS.gridLines);
    const hubCard = root.querySelector(SELECTORS.hubCard);

    // Grid lines scale up from center
    if (gridLines.length > 0) {
        tl.add(gridLines, {
            opacity: [0, 1],
            scaleY: [0, 1],
            duration: SCENE_DURATIONS.intro * 0.6,
            delay: stagger(STAGGER.fast, { from: "center" }),
            easing: EASINGS.snappy,
        }, SCENE_LABELS.intro);
    }

    // Hub card drops in with elastic
    if (hubCard) {
        tl.add(hubCard, {
            opacity: [0, 1],
            scale: [TRANSFORMS.scaleIn.from, TRANSFORMS.scaleIn.to],
            translateY: [-20, 0],
            duration: SCENE_DURATIONS.intro * 0.4,
            easing: EASINGS.elastic,
        }, `${SCENE_LABELS.intro}+=${SCENE_DURATIONS.intro * 0.5}`);
    }
}

// ============================================================================
// SCENE 1: ORDER ENTRY
// ============================================================================

function attachOrderScene(tl: Timeline, root: HTMLElement): void {
    const orderOrb = root.querySelector(SELECTORS.orderOrb);
    const caption = root.querySelector("[data-rune-caption='order']");

    // Order orb slides in from left
    if (orderOrb) {
        tl.add(orderOrb, {
            opacity: [0, 1],
            translateX: [-100, 0],
            translateY: [-50, 0],
            scale: [0.5, 1],
            duration: SCENE_DURATIONS.orderEntry,
            easing: EASINGS.snappy,
        }, SCENE_LABELS.orderEntry);
    }

    // Caption fades in
    if (caption) {
        tl.add(caption, {
            opacity: [0, 1],
            translateY: [TRANSFORMS.slideUp.from, TRANSFORMS.slideUp.to],
            duration: DURATIONS.slow,
            easing: EASINGS.smooth,
        }, `${SCENE_LABELS.orderEntry}+=${SCENE_DURATIONS.orderEntry * 0.3}`);
    }
}

// ============================================================================
// SCENE 2: ROUTING BRAIN
// ============================================================================

function attachRoutingScene(tl: Timeline, root: HTMLElement): void {
    const tracks = root.querySelectorAll(SELECTORS.tracks);
    const nodes = root.querySelectorAll(SELECTORS.nodes);

    // Tracks extend outward (simulated with scaleX)
    if (tracks.length > 0) {
        tl.add(tracks, {
            opacity: [0, 1],
            scaleX: [0, 1],
            duration: SCENE_DURATIONS.routing * 0.5,
            delay: stagger(STAGGER.normal),
            easing: EASINGS.snappy,
        }, SCENE_LABELS.routing);
    }

    // Nodes pop in with stagger
    if (nodes.length > 0) {
        tl.add(nodes, {
            opacity: [0, 1],
            scale: [0.6, 1],
            duration: DURATIONS.normal,
            delay: stagger(STAGGER.cascade),
            easing: EASINGS.elastic,
        }, `${SCENE_LABELS.routing}+=${SCENE_DURATIONS.routing * 0.4}`);
    }
}

// ============================================================================
// SCENE 3: PARALLEL AUTOMATION
// ============================================================================

function attachParallelScene(tl: Timeline, root: HTMLElement): void {
    const tokens = root.querySelectorAll(SELECTORS.tokens);
    const nodes = root.querySelectorAll(SELECTORS.nodes);

    // Tokens travel to nodes
    if (tokens.length > 0) {
        tl.add(tokens, {
            opacity: [0, 1, 1, 0.8],
            translateX: [0, "var(--token-end-x)"],
            translateY: [0, "var(--token-end-y)"],
            scale: [1, 0.8, 0.9, 1],
            duration: SCENE_DURATIONS.parallel * 0.6,
            delay: stagger(STAGGER.fast),
            easing: EASINGS.snappy,
        }, SCENE_LABELS.parallelStart);
    }

    // Nodes light up (checkmark appears)
    if (nodes.length > 0) {
        const checkmarks = root.querySelectorAll("[data-rune-checkmark]");
        if (checkmarks.length > 0) {
            tl.add(checkmarks, {
                opacity: [0, 1],
                scale: [0.8, 1],
                duration: DURATIONS.fast,
                delay: stagger(STAGGER.normal),
                easing: EASINGS.bounce,
            }, `${SCENE_LABELS.parallelStart}+=${SCENE_DURATIONS.parallel * 0.5}`);
        }
    }
}

// ============================================================================
// SCENE 4: LOGS + KPIS
// ============================================================================

function attachLogsScene(tl: Timeline, root: HTMLElement): void {
    const terminal = root.querySelector("[data-rune-terminal]");
    const logLines = root.querySelectorAll(SELECTORS.logLines);
    const kpiCards = root.querySelectorAll(SELECTORS.kpiCards);

    // Terminal slides in
    if (terminal) {
        tl.add(terminal, {
            opacity: [0, 1],
            translateX: [50, 0],
            duration: DURATIONS.slow,
            easing: EASINGS.smooth,
        }, SCENE_LABELS.logs);
    }

    // Log lines appear one by one
    if (logLines.length > 0) {
        tl.add(logLines, {
            opacity: [0, 1],
            translateY: [10, 0],
            duration: DURATIONS.fast,
            delay: stagger(STAGGER.normal),
            easing: EASINGS.snappy,
        }, `${SCENE_LABELS.logs}+=${DURATIONS.normal}`);
    }

    // KPI cards with number counting (using anime value tweening)
    if (kpiCards.length > 0) {
        tl.add(kpiCards, {
            opacity: [0, 1],
            translateY: [TRANSFORMS.slideUp.from, TRANSFORMS.slideUp.to],
            duration: DURATIONS.normal,
            delay: stagger(STAGGER.slow),
            easing: EASINGS.smooth,
        }, `${SCENE_LABELS.logs}+=${SCENE_DURATIONS.logs * 0.5}`);
    }
}

// ============================================================================
// SCENE 5: WORKFLOW BUILDER + CTA
// ============================================================================

function attachBuilderScene(tl: Timeline, root: HTMLElement): void {
    const blocks = root.querySelectorAll(SELECTORS.builderBlocks);
    const connections = root.querySelectorAll(SELECTORS.connections);
    const ctaButton = root.querySelector(SELECTORS.ctaButton);

    // Blocks slide in diagonally
    if (blocks.length > 0) {
        tl.add(blocks, {
            opacity: [0, 1],
            translateX: [-30, 0],
            translateY: [20, 0],
            duration: DURATIONS.normal,
            delay: stagger(STAGGER.cascade),
            easing: EASINGS.snappy,
        }, SCENE_LABELS.builder);
    }

    // Connections grow between blocks
    if (connections.length > 0) {
        tl.add(connections, {
            opacity: [0, 1],
            scaleX: [0, 1],
            duration: DURATIONS.slow,
            delay: stagger(STAGGER.normal),
            easing: EASINGS.smooth,
        }, `${SCENE_LABELS.builder}+=${SCENE_DURATIONS.builder * 0.4}`);
    }

    // CTA appears last
    if (ctaButton) {
        tl.add(ctaButton, {
            opacity: [0, 1],
            scale: [0.95, 1],
            duration: DURATIONS.slow,
            easing: EASINGS.smooth,
        }, SCENE_LABELS.cta);
    }
}

// ============================================================================
// REDUCED MOTION FALLBACK
// ============================================================================

function attachReducedMotionScene(tl: Timeline, root: HTMLElement): void {
    // Simple: fade in all scenes at once
    const allScenes = root.querySelectorAll("[data-rune-scene]");

    tl.add(allScenes, {
        opacity: [0, 1],
        duration: 0,
    });
}
