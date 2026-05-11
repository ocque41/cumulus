"use client";

/**
 * RuneParallelScene - Scene 3: Parallel Automation
 * 
 * Shows multiple tasks firing in parallel:
 * - Order orb clones into tokens
 * - Tokens travel simultaneously to each node
 * - Nodes light up with checkmarks when tokens arrive
 * 
 * Animation:
 * - Tokens split and travel with stagger
 * - Nodes pulse and show checkmarks with bounce
 */

import type { Breakpoint } from "@/hooks";
import { getBreakpointConfig } from "./animation-config";

// Token destinations (should match NODES in routing scene)
const TOKEN_TARGETS = [
    { id: "token-inventory", endX: -150, endY: -60 },
    { id: "token-payments", endX: -100, endY: -30 },
    { id: "token-fraud", endX: 180, endY: 0 },
    { id: "token-notifications", endX: 100, endY: 30 },
    { id: "token-crm", endX: 150, endY: 60 },
    { id: "token-email", endX: 0, endY: 90 },
];

interface RuneParallelSceneProps {
    breakpoint: Breakpoint;
}

export function RuneParallelScene({ breakpoint }: RuneParallelSceneProps) {
    const config = getBreakpointConfig(breakpoint);
    const visibleTokens = TOKEN_TARGETS.slice(0, config.nodeCount);

    // Scale distances for mobile
    const scaleFactor = breakpoint === "mobile" ? 0.5 : 1;

    return (
        <div data-rune-scene="parallel" className="absolute inset-0 pointer-events-none">
            {/* Tokens that travel to nodes */}
            {visibleTokens.map((token) => (
                <div
                    key={token.id}
                    className="rune-token"
                    data-rune-token
                    style={{
                        left: "50%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        opacity: 0,
                        // CSS custom properties for animation end position
                        "--token-end-x": `${token.endX * scaleFactor}px`,
                        "--token-end-y": `${token.endY * scaleFactor}px`,
                    } as React.CSSProperties}
                />
            ))}

            {/* Caption */}
            <div
                className="rune-caption"
                data-rune-caption="parallel"
                style={{
                    opacity: 0,
                    left: "auto",
                    right: "2rem",
                    bottom: "25%",
                }}
            >
                <h4 className="rune-caption-title">
                    Parallel Execution
                </h4>
                <p className="rune-caption-text">
                    All integrations fire simultaneously.
                    No waiting, no bottlenecks.
                </p>
            </div>
        </div>
    );
}
