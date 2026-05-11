"use client";

/**
 * RuneLogsScene - Scene 4: Runtime Logs + KPIs
 * 
 * Shows a floating terminal panel with runtime logs
 * and KPI cards with animated counting numbers.
 * 
 * Animation:
 * - Terminal slides in from right
 * - Log lines appear one by one
 * - KPI values count up with number tweening
 */

import type { Breakpoint } from "@/hooks";

// Log entries to display
const LOG_ENTRIES = [
    { time: "14:32:01", message: "Order #4921 received", type: "info" },
    { time: "14:32:01", message: "VIP customer detected", type: "info" },
    { time: "14:32:02", message: "Inventory reserved ✓", type: "success" },
    { time: "14:32:02", message: "Payment processed ✓", type: "success" },
    { time: "14:32:03", message: "Fraud check passed ✓", type: "success" },
    { time: "14:32:03", message: "Slack notification sent ✓", type: "success" },
    { time: "14:32:04", message: "Order automation complete", type: "success" },
];

// KPI metrics
const KPIS = [
    { id: "latency", value: 24, unit: "ms", label: "Avg Latency" },
    { id: "automated", value: 97, unit: "%", label: "Automated" },
    { id: "escalations", value: 3, unit: "%", label: "Escalations" },
];

interface RuneLogsSceneProps {
    breakpoint: Breakpoint;
}

export function RuneLogsScene({ breakpoint }: RuneLogsSceneProps) {
    const isMobile = breakpoint === "mobile";

    return (
        <div data-rune-scene="logs" className="absolute inset-0 pointer-events-none">
            {/* Terminal Panel */}
            <div
                className="rune-terminal"
                data-rune-terminal
                style={{
                    opacity: 0,
                    ...(isMobile && {
                        position: "absolute",
                        bottom: "2rem",
                        right: "1rem",
                        left: "1rem",
                        top: "auto",
                        width: "auto",
                        transform: "none",
                    }),
                }}
            >
                {/* Terminal Header */}
                <div className="rune-terminal-header">
                    <div className="rune-terminal-dot rune-terminal-dot--red" />
                    <div className="rune-terminal-dot rune-terminal-dot--yellow" />
                    <div className="rune-terminal-dot rune-terminal-dot--green" />
                    <span className="rune-terminal-title">Runtime Logs</span>
                </div>

                {/* Terminal Body */}
                <div className="rune-terminal-body">
                    {LOG_ENTRIES.map((log, index) => (
                        <div
                            key={index}
                            className={`rune-log ${log.type === "success" ? "rune-log--success" : "rune-log--info"}`}
                            data-rune-log
                            style={{ opacity: 0 }}
                        >
                            <span className="rune-log-time">{log.time}</span>
                            <span className="rune-log-message">{log.message}</span>
                        </div>
                    ))}
                </div>

                {/* KPI Cards */}
                <div className="rune-kpis" style={{ padding: "0 1rem 1rem" }}>
                    {KPIS.map((kpi) => (
                        <div
                            key={kpi.id}
                            className="rune-kpi"
                            data-rune-kpi={kpi.id}
                            data-rune-kpi-value={kpi.value}
                            style={{ opacity: 0, flex: 1 }}
                        >
                            <div className="rune-kpi-value">
                                <span data-rune-kpi-number>{kpi.value}</span>
                                <span>{kpi.unit}</span>
                            </div>
                            <div className="rune-kpi-label">{kpi.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Caption (desktop only, mobile has terminal full-width) */}
            {!isMobile && (
                <div
                    className="rune-caption"
                    data-rune-caption="logs"
                    style={{ opacity: 0 }}
                >
                    <h4 className="rune-caption-title">
                        Real-time Visibility
                    </h4>
                    <p className="rune-caption-text">
                        Every action logged. Every metric tracked.
                        Full transparency into your automations.
                    </p>
                </div>
            )}
        </div>
    );
}
