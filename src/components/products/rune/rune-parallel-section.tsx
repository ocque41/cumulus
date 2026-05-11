"use client";

/**
 * RuneParallelSection - Parallel execution nodes grid
 * 
 * Shows integration nodes that receive parallel data.
 * Nodes pop in with stagger animation from center.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "@/hooks";
import { createNodeChipsEntrance } from "./rune-animations";
import { RuneNodeChip } from "./rune-node-chip";

interface IntegrationNode {
    id: string;
    icon: ReactNode;
    label: string;
}

interface RuneParallelSectionProps {
    nodes: IntegrationNode[];
    reducedMotion?: boolean;
}

export function RuneParallelSection({
    nodes,
    reducedMotion = false,
}: RuneParallelSectionProps) {
    const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
    const nodesContainerRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Staggered entrance
    useEffect(() => {
        if (!isInView || hasAnimated || reducedMotion) return;
        if (!nodesContainerRef.current) return;

        const nodeEls = nodesContainerRef.current.querySelectorAll(".rune-node-chip");
        if (nodeEls.length > 0) {
            createNodeChipsEntrance(nodeEls);
        }

        setHasAnimated(true);
    }, [isInView, hasAnimated, reducedMotion]);

    const chipInitialStyle = reducedMotion || hasAnimated
        ? { opacity: 1, transform: "none" }
        : { opacity: 0, transform: "scale(0.6) translateY(20px)" };

    return (
        <div ref={ref} className="rune-parallel-wrapper">
            <div className="rune-parallel-header">
                <span className="rune-parallel-badge">PARALLEL EXECUTION</span>
                <h3 className="rune-parallel-title">Zero Bottlenecks</h3>
                <p className="rune-parallel-desc">
                    All integrations fire simultaneously. Stripe, SendGrid, Slack, CRM—in parallel.
                </p>
            </div>

            <div ref={nodesContainerRef} className="rune-parallel-nodes">
                {nodes.map((node) => (
                    <div key={node.id} style={chipInitialStyle}>
                        <RuneNodeChip
                            icon={node.icon}
                            label={node.label}
                            isActive={true}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
