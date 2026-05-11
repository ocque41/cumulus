"use client";

/**
 * RuneSceneBlock - Individual scene block with entrance animation
 * 
 * Each scene animates in when it enters the viewport using IntersectionObserver.
 * One-shot animation: translateY + opacity + slight scale overshoot.
 * 
 * If prefers-reduced-motion is enabled, components are visible immediately
 * without animation.
 */

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";
import { useInView } from "@/hooks";

interface SceneData {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    icon: string;
    metrics?: Array<{ label: string; value: string }>;
    isCTA?: boolean;
}

interface RuneSceneBlockProps {
    scene: SceneData;
    index: number;
    isMobile: boolean;
    reducedMotion: boolean;
}

export function RuneSceneBlock({
    scene,
    index,
    isMobile,
    reducedMotion,
}: RuneSceneBlockProps) {
    const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.15 });
    const contentRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Entrance animation when in view
    useEffect(() => {
        if (!isInView || hasAnimated || reducedMotion || !contentRef.current) return;

        // Run entrance animation
        animate(contentRef.current, {
            opacity: [0, 1],
            translateY: [40, 0],
            scale: [0.98, 1],
            duration: 500,
            easing: "easeOutCubic",
        });

        setHasAnimated(true);
    }, [isInView, hasAnimated, reducedMotion]);

    // For reduced motion, just show content immediately
    const initialStyle = reducedMotion
        ? { opacity: 1, transform: "none" }
        : { opacity: 0, transform: "translateY(40px) scale(0.98)" };

    return (
        <div
            ref={ref}
            className={`rune-scene-block ${scene.isCTA ? "rune-scene-block--cta" : ""}`}
            data-scene={scene.id}
        >
            <div
                ref={contentRef}
                className="rune-scene-content"
                style={hasAnimated || reducedMotion ? { opacity: 1, transform: "none" } : initialStyle}
            >
                {/* Scene number indicator */}
                <div className="rune-scene-number">
                    <span>{String(index + 1).padStart(2, "0")}</span>
                </div>

                {/* Icon */}
                <div className="rune-scene-icon" aria-hidden="true">
                    {scene.icon}
                </div>

                {/* Text content */}
                <div className="rune-scene-text">
                    <span className="rune-scene-subtitle">{scene.subtitle}</span>
                    <h3 className="rune-scene-title">{scene.title}</h3>
                    <p className="rune-scene-description">{scene.description}</p>
                </div>

                {/* Metrics (for logs scene) */}
                {scene.metrics && (
                    <div className="rune-scene-metrics">
                        {scene.metrics.map((metric) => (
                            <div key={metric.label} className="rune-metric">
                                <span className="rune-metric-value">{metric.value}</span>
                                <span className="rune-metric-label">{metric.label}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* CTA button (for builder scene) */}
                {scene.isCTA && (
                    <div className="rune-scene-cta">
                        <button className="rune-cta-button">
                            Build Your Automation
                        </button>
                        <p className="rune-cta-subtext">
                            No code required • Deploy in minutes
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
