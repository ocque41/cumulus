"use client";

/**
 * RuneNodeChip - Small pill/chip for integration nodes
 * 
 * Used in parallel execution section to show integrations
 * like Stripe, Slack, SendGrid, etc.
 */

import { type ReactNode } from "react";

interface RuneNodeChipProps {
    icon: ReactNode;
    label: string;
    isActive?: boolean;
    className?: string;
}

export function RuneNodeChip({
    icon,
    label,
    isActive = false,
    className = "",
}: RuneNodeChipProps) {
    return (
        <div className={`rune-node-chip ${isActive ? "rune-node-chip--active" : ""} ${className}`}>
            <span className="rune-node-chip-icon">{icon}</span>
            <span className="rune-node-chip-label">{label}</span>
            {isActive && <span className="rune-node-chip-pulse" />}
        </div>
    );
}
