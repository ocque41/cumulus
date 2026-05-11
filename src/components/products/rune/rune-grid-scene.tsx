"use client";

/**
 * RuneGridScene - Scene 0: System Boot
 * 
 * Renders the infinite perspective grid and central "Order Hub" card.
 * This is the opening visual that establishes the control room aesthetic.
 * 
 * Animation:
 * - Grid lines scale up from center with opacity
 * - Hub card drops in with elastic easing
 * - Subtle pulsing glow on the hub
 */

import type { Breakpoint } from "@/hooks";

interface RuneGridSceneProps {
    breakpoint: Breakpoint;
}

export function RuneGridScene({ breakpoint }: RuneGridSceneProps) {
    const showGrid = breakpoint === "desktop" || breakpoint === "tablet";
    const gridLineCount = breakpoint === "desktop" ? 20 : 12;

    return (
        <div data-rune-scene="intro" className="absolute inset-0">
            {/* Perspective Grid (desktop/tablet only) */}
            {showGrid && (
                <div className="rune-grid" aria-hidden="true">
                    <div className="rune-grid-plane">
                        {/* Vertical grid lines */}
                        {Array.from({ length: gridLineCount }).map((_, i) => (
                            <div
                                key={`v-${i}`}
                                className="rune-grid-line rune-grid-line--vertical"
                                data-rune-grid-line
                                style={{
                                    gridColumn: Math.floor((i / gridLineCount) * 40) + 1,
                                    opacity: 0,
                                }}
                            />
                        ))}
                        {/* Horizontal grid lines */}
                        {Array.from({ length: Math.floor(gridLineCount / 2) }).map((_, i) => (
                            <div
                                key={`h-${i}`}
                                className="rune-grid-line rune-grid-line--horizontal"
                                data-rune-grid-line
                                style={{
                                    gridRow: Math.floor((i / (gridLineCount / 2)) * 20) + 1,
                                    opacity: 0,
                                }}
                            />
                        ))}
                    </div>
                    <div className="rune-grid-glow" />
                </div>
            )}

            {/* Central Hub Card */}
            <div
                className="rune-hub"
                data-rune-hub
                style={{ opacity: 0 }}
            >
                <div className="rune-hub-glow" aria-hidden="true" />

                {/* Cart Icon */}
                <svg
                    className="rune-hub-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                >
                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>

                <h3 className="rune-hub-title">Boutique Order Hub</h3>
                <p className="rune-hub-subtitle">Order #4921</p>
            </div>
        </div>
    );
}
