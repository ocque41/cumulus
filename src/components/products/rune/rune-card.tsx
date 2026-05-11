"use client";

/**
 * RuneCard - Base card component for Rune section
 * 
 * Futuristic card design with:
 * - Rounded rectangle shape with inner shadow
 * - Faint glowing animated border
 * - Circuit trace accents
 * - Clear typography hierarchy
 * 
 * All entrances powered by anime.js.
 */

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "@/hooks";
import { createCardEntrance, createHubBootAnimation } from "./rune-animations";

interface RuneCardProps {
    variant?: "default" | "hero" | "routing" | "builder";
    title: string;
    subtitle?: string;
    status?: string;
    statusType?: "live" | "active" | "vip" | "automated";
    icon?: ReactNode;
    children?: ReactNode;
    className?: string;
    reducedMotion?: boolean;
    delay?: number;
}

export function RuneCard({
    variant = "default",
    title,
    subtitle,
    status,
    statusType = "active",
    icon,
    children,
    className = "",
    reducedMotion = false,
    delay = 0,
}: RuneCardProps) {
    const [ref, isInView] = useInView<HTMLDivElement>({ threshold: 0.2 });
    const cardRef = useRef<HTMLDivElement>(null);
    const borderRef = useRef<HTMLDivElement>(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    // Entrance animation
    useEffect(() => {
        if (!isInView || hasAnimated || reducedMotion || !cardRef.current) return;

        createCardEntrance(cardRef.current, delay);
        setHasAnimated(true);

        // Hero variant gets boot animation on border
        if (variant === "hero" && borderRef.current) {
            setTimeout(() => {
                if (borderRef.current) {
                    createHubBootAnimation(borderRef.current);
                }
            }, 500 + delay);
        }
    }, [isInView, hasAnimated, reducedMotion, delay, variant]);

    const initialStyle = reducedMotion || hasAnimated
        ? { opacity: 1, transform: "none" }
        : { opacity: 0, transform: "translateY(30px) scale(0.98)" };

    return (
        <div
            ref={ref}
            className={`rune-card rune-card--${variant} ${className}`}
        >
            <div ref={cardRef} className="rune-card-inner" style={initialStyle}>
                {/* Animated glow border */}
                <div ref={borderRef} className="rune-card-border" />

                {/* Corner accents (circuit traces) */}
                <div className="rune-card-accent rune-card-accent--tl" />
                <div className="rune-card-accent rune-card-accent--tr" />
                <div className="rune-card-accent rune-card-accent--bl" />
                <div className="rune-card-accent rune-card-accent--br" />

                {/* Header */}
                <div className="rune-card-header">
                    {icon && (
                        <div className="rune-card-icon">
                            {icon}
                        </div>
                    )}
                    <div className="rune-card-titles">
                        {status && (
                            <span className={`rune-card-status rune-card-status--${statusType}`}>
                                {status}
                            </span>
                        )}
                        <h3 className="rune-card-title">{title}</h3>
                        {subtitle && (
                            <p className="rune-card-subtitle">{subtitle}</p>
                        )}
                    </div>
                </div>

                {/* Content */}
                {children && (
                    <div className="rune-card-content">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
