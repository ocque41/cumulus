"use client";

/**
 * RuneRoutingScene - Scene 2: Routing Brain
 * 
 * The hub splits into multiple tracks extending to integration nodes:
 * Inventory, Payments, Fraud, Notifications, CRM
 * 
 * Animation:
 * - Tracks extend outward with scaleX animation
 * - Nodes pop in with staggered scale/opacity
 * - Small particles run along tracks (desktop only)
 */

import type { Breakpoint } from "@/hooks";
import { getBreakpointConfig } from "./animation-config";

// Integration nodes configuration
const NODES = [
    { id: "inventory", label: "Inventory", icon: "📦", angle: -60 },
    { id: "payments", label: "Stripe", icon: "💳", angle: -30 },
    { id: "fraud", label: "Fraud Check", icon: "🛡️", angle: 0 },
    { id: "notifications", label: "Slack", icon: "🔔", angle: 30 },
    { id: "crm", label: "CRM", icon: "👤", angle: 60 },
    { id: "email", label: "SendGrid", icon: "✉️", angle: 90 },
];

interface RuneRoutingSceneProps {
    breakpoint: Breakpoint;
}

export function RuneRoutingScene({ breakpoint }: RuneRoutingSceneProps) {
    const config = getBreakpointConfig(breakpoint);
    const visibleNodes = NODES.slice(0, config.nodeCount);
    const trackLength = breakpoint === "mobile" ? 100 : 180;

    return (
        <div data-rune-scene="routing" className="absolute inset-0 pointer-events-none">
            <div className="rune-tracks-container">
                {visibleNodes.map((node, index) => {
                    // Calculate track position based on angle
                    const angleRad = (node.angle * Math.PI) / 180;
                    const endX = Math.cos(angleRad) * trackLength;
                    const endY = Math.sin(angleRad) * trackLength * 0.5; // Compress vertically for perspective

                    return (
                        <div key={node.id}>
                            {/* Track line */}
                            <div
                                className="rune-track"
                                data-rune-track
                                style={{
                                    width: `${trackLength}px`,
                                    transform: `rotate(${node.angle}deg) scaleX(0)`,
                                    transformOrigin: "left center",
                                    left: "50%",
                                    top: "50%",
                                    opacity: 0,
                                }}
                            />

                            {/* Node at end of track */}
                            <div
                                className="rune-node"
                                data-rune-node={node.id}
                                style={{
                                    left: `calc(50% + ${endX}px)`,
                                    top: `calc(50% + ${endY}px)`,
                                    transform: "translate(-50%, -50%)",
                                    opacity: 0,
                                    scale: 0.6,
                                }}
                            >
                                <span className="rune-node-icon" aria-hidden="true">
                                    {node.icon}
                                </span>
                                <span>{node.label}</span>

                                {/* Checkmark (hidden initially, shown in parallel scene) */}
                                <div
                                    className="rune-node-checkmark"
                                    data-rune-checkmark
                                    style={{ opacity: 0, scale: 0.8 }}
                                    aria-hidden="true"
                                >
                                    ✓
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Caption */}
            <div
                className="rune-caption"
                data-rune-caption="routing"
                style={{ opacity: 0 }}
            >
                <h4 className="rune-caption-title">
                    Intelligent Routing
                </h4>
                <p className="rune-caption-text">
                    Rune analyzes the order and routes it to
                    the right integrations automatically.
                </p>
            </div>
        </div>
    );
}
