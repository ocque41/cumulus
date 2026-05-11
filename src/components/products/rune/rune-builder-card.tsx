"use client";

/**
 * RuneBuilderCard - Workflow builder with animated nodes and CTA
 * 
 * Shows a visual workflow with connected nodes.
 * Nodes slide in sequentially, connections grow between them.
 * CTA button has continuous shimmer animation.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "@/hooks";
import {
    createBuilderCardEntrance,
    createBuilderNodesEntrance,
    createConnectionLinesGrow,
    createCtaShimmerLoop,
} from "./rune-animations";

interface WorkflowNode {
    id: string;
    icon: ReactNode;
    label: string;
}

interface RuneBuilderCardProps {
    nodes: WorkflowNode[];
    reducedMotion?: boolean;
}

export function RuneBuilderCard({
    nodes,
    reducedMotion = false,
}: RuneBuilderCardProps) {
    const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
    const cardRef = useRef<HTMLDivElement>(null);
    const nodesContainerRef = useRef<HTMLDivElement>(null);
    const shimmerRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Entrance animations
    useEffect(() => {
        if (!isInView || hasAnimated || reducedMotion) return;
        if (!cardRef.current || !nodesContainerRef.current) return;

        // Card entrance
        createBuilderCardEntrance(cardRef.current);

        // Nodes slide in
        const nodeEls = nodesContainerRef.current.querySelectorAll(".rune-builder-node");
        if (nodeEls.length > 0) {
            setTimeout(() => {
                createBuilderNodesEntrance(nodeEls);
            }, 200);
        }

        // Connections grow
        const connectionEls = nodesContainerRef.current.querySelectorAll(".rune-builder-connection");
        if (connectionEls.length > 0) {
            setTimeout(() => {
                createConnectionLinesGrow(connectionEls);
            }, 400);
        }

        // CTA shimmer loop
        if (shimmerRef.current) {
            setTimeout(() => {
                if (shimmerRef.current) {
                    createCtaShimmerLoop(shimmerRef.current);
                }
            }, 800);
        }

        setHasAnimated(true);
    }, [isInView, hasAnimated, reducedMotion]);

    const initialStyle = reducedMotion || hasAnimated
        ? { opacity: 1, transform: "none" }
        : { opacity: 0, transform: "scale(0.95)" };

    const nodeInitialStyle = reducedMotion || hasAnimated
        ? { opacity: 1, transform: "none" }
        : { opacity: 0, transform: "translateX(-40px) translateY(20px)" };

    const connectionInitialStyle = reducedMotion || hasAnimated
        ? { opacity: 1, transform: "scaleX(1)" }
        : { opacity: 0, transform: "scaleX(0)" };

    return (
        <div ref={ref} className="rune-builder-wrapper">
            <div ref={cardRef} className="rune-builder-card" style={initialStyle}>
                {/* Card border glow */}
                <div className="rune-builder-border" />

                {/* Header */}
                <div className="rune-builder-header">
                    <span className="rune-builder-badge">WORKFLOW BUILDER</span>
                    <h3 className="rune-builder-title">Build Your Own Automation</h3>
                    <p className="rune-builder-subtitle">
                        Design custom workflows with our visual builder
                    </p>
                </div>

                {/* Workflow nodes */}
                <div ref={nodesContainerRef} className="rune-builder-flow">
                    {nodes.map((node, index) => (
                        <div key={node.id} className="rune-builder-step">
                            {/* Connection line (except first) */}
                            {index > 0 && (
                                <div
                                    className="rune-builder-connection"
                                    style={connectionInitialStyle}
                                />
                            )}
                            {/* Node */}
                            <div className="rune-builder-node" style={nodeInitialStyle}>
                                <span className="rune-builder-node-icon">{node.icon}</span>
                                <span className="rune-builder-node-label">{node.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA Button */}
                <div className="rune-builder-cta">
                    <button className="rune-cta-btn">
                        <span className="rune-cta-text">Build Your Automation</span>
                        <div ref={shimmerRef} className="rune-cta-shimmer" />
                    </button>
                    <p className="rune-cta-hint">No code required • Deploy in minutes</p>
                </div>
            </div>
        </div>
    );
}
