"use client";

/**
 * RuneLogsPanel - Terminal-style logs with KPI counters
 * 
 * Large monospaced panel showing runtime logs and metrics.
 * Anime.js powers log line stagger and KPI number tweening.
 */

import { useEffect, useRef, useState } from "react";
import { useInView } from "@/hooks";
import {
    createLogsPanelEntrance,
    createLogLinesEntrance,
} from "./rune-animations";
import { animate } from "animejs";

interface LogEntry {
    time: string;
    message: string;
    type?: "info" | "success" | "warning";
}

interface KpiData {
    label: string;
    value: number;
    suffix: string;
}

interface RuneLogsPanelProps {
    logs: LogEntry[];
    kpis: KpiData[];
    reducedMotion?: boolean;
}

export function RuneLogsPanel({
    logs,
    kpis,
    reducedMotion = false,
}: RuneLogsPanelProps) {
    const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
    const panelRef = useRef<HTMLDivElement>(null);
    const logsContainerRef = useRef<HTMLDivElement>(null);
    const kpiRefs = useRef<(HTMLSpanElement | null)[]>([]);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Entrance animations
    useEffect(() => {
        if (!isInView || hasAnimated || reducedMotion) return;
        if (!panelRef.current || !logsContainerRef.current) return;

        // Panel slides up
        createLogsPanelEntrance(panelRef.current);

        // Log lines stagger in
        const logLines = logsContainerRef.current.querySelectorAll(".rune-log-line");
        if (logLines.length > 0) {
            setTimeout(() => {
                createLogLinesEntrance(logLines);
            }, 300);
        }

        // KPI counters animate using simple interval (anime v4 changed object tweening API)
        kpiRefs.current.forEach((kpiEl, index) => {
            if (!kpiEl) return;
            const kpi = kpis[index];
            if (!kpi) return;

            const startTime = Date.now();
            const duration = 800;
            const startDelay = 500 + index * 150;

            setTimeout(() => {
                const animateValue = () => {
                    const elapsed = Date.now() - startTime - startDelay;
                    const progress = Math.min(elapsed / duration, 1);
                    // Ease out quad
                    const eased = 1 - (1 - progress) * (1 - progress);
                    const current = Math.round(eased * kpi.value);
                    if (kpiEl) {
                        kpiEl.textContent = `${current}${kpi.suffix}`;
                    }
                    if (progress < 1) {
                        requestAnimationFrame(animateValue);
                    }
                };
                animateValue();
            }, startDelay);
        });

        setHasAnimated(true);
    }, [isInView, hasAnimated, reducedMotion, kpis]);

    const initialStyle = reducedMotion || hasAnimated
        ? { opacity: 1, transform: "none" }
        : { opacity: 0, transform: "translateY(60px)" };

    return (
        <div ref={ref} className="rune-logs-wrapper">
            <div ref={panelRef} className="rune-logs-panel" style={initialStyle}>
                {/* Terminal header */}
                <div className="rune-logs-header">
                    <div className="rune-logs-dots">
                        <span className="rune-logs-dot rune-logs-dot--red" />
                        <span className="rune-logs-dot rune-logs-dot--yellow" />
                        <span className="rune-logs-dot rune-logs-dot--green" />
                    </div>
                    <span className="rune-logs-title">RUNE RUNTIME</span>
                </div>

                {/* Log entries */}
                <div ref={logsContainerRef} className="rune-logs-body">
                    {logs.map((log, index) => (
                        <div
                            key={index}
                            className={`rune-log-line rune-log-line--${log.type || "info"}`}
                            style={reducedMotion || hasAnimated ? {} : { opacity: 0, transform: "translateY(15px)" }}
                        >
                            <span className="rune-log-time">{log.time}</span>
                            <span className="rune-log-msg">{log.message}</span>
                        </div>
                    ))}
                </div>

                {/* KPI cards */}
                <div className="rune-logs-kpis">
                    {kpis.map((kpi, index) => (
                        <div key={kpi.label} className="rune-kpi-card">
                            <span
                                ref={(el) => { kpiRefs.current[index] = el; }}
                                className="rune-kpi-value"
                            >
                                {reducedMotion ? `${kpi.value}${kpi.suffix}` : `0${kpi.suffix}`}
                            </span>
                            <span className="rune-kpi-label">{kpi.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
