"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { animate, stagger } from "animejs";

import { cn } from "@/lib/utils";

interface BentoGridProps {
    children: ReactNode;
    className?: string;
    /** Grid columns configuration */
    columns?: number;
    /** Enable stagger entrance animation */
    animateEntrance?: boolean;
    /** Animation origin point */
    entranceFrom?: "center" | "first" | "last" | "edges";
}

/**
 * Kinetic Bento Grid with stagger entrance animation.
 * 
 * Creates a modern grid layout where cards ripple into existence
 * from a configurable origin point.
 */
export function BentoGrid({
    children,
    className,
    columns = 3,
    animateEntrance = true,
    entranceFrom = "center",
}: BentoGridProps) {
    const gridRef = useRef<HTMLDivElement>(null);
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        if (!animateEntrance || isAnimated) return;
        if (typeof window === "undefined") return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setIsAnimated(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isAnimated) {
                    setIsAnimated(true);

                    const cards = gridRef.current?.querySelectorAll(".bento-card");
                    if (!cards) return;

                    animate(cards, {
                        scale: [0, 1],
                        opacity: [0, 1],
                        translateZ: [100, 0],
                        duration: 800,
                        // @ts-expect-error - Anime.js v4 stagger types are incorrect
                        delay: stagger(80, { from: entranceFrom }),
                        easing: "easeOutElastic(1, .8)",
                    });

                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (gridRef.current) {
            observer.observe(gridRef.current);
        }

        return () => observer.disconnect();
    }, [animateEntrance, isAnimated, columns, entranceFrom]);

    return (
        <div
            ref={gridRef}
            className={cn(
                "grid gap-4",
                `grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`,
                className
            )}
            style={{
                perspective: "1000px",
            }}
        >
            {children}
        </div>
    );
}

interface BentoCardProps {
    children: ReactNode;
    className?: string;
    /** Card spans multiple columns */
    colSpan?: 1 | 2 | 3;
    /** Card spans multiple rows */
    rowSpan?: 1 | 2;
    /** Glassmorphism effect */
    glass?: boolean;
    /** Hover glow color */
    glowColor?: string;
    /** Make entire card clickable */
    href?: string;
    onClick?: () => void;
}

/**
 * Individual Bento Grid card with glass effect and hover glow.
 */
export function BentoCard({
    children,
    className,
    colSpan = 1,
    rowSpan = 1,
    glass = true,
    glowColor = "rgba(0, 243, 255, 0.15)",
    href,
    onClick,
}: BentoCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current || !glowRef.current) return;

        const rect = cardRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        glowRef.current.style.background = `radial-gradient(
      400px circle at ${x}px ${y}px,
      ${glowColor},
      transparent 60%
    )`;
    };

    const handleMouseLeave = () => {
        if (glowRef.current) {
            glowRef.current.style.background = "transparent";
        }
    };

    const colSpanClass = {
        1: "",
        2: "md:col-span-2",
        3: "md:col-span-3",
    }[colSpan];

    const rowSpanClass = {
        1: "",
        2: "md:row-span-2",
    }[rowSpan];

    const content = (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={cn(
                "bento-card relative overflow-hidden rounded-[5.5px]",
                "transition-all duration-300",
                glass && [
                    "backdrop-blur-xl bg-white/5",
                    "border border-white/10",
                ],
                colSpanClass,
                rowSpanClass,
                (href || onClick) && "cursor-pointer hover:border-white/20",
                className
            )}
            style={{
                opacity: 0, // Will be animated
                transformStyle: "preserve-3d",
            }}
        >
            {/* Glow overlay */}
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            />

            {/* Content */}
            <div className="relative z-0 h-full">
                {children}
            </div>
        </div>
    );

    if (href) {
        return <a href={href}>{content}</a>;
    }

    return content;
}

interface BentoCardHeaderProps {
    title: string;
    subtitle?: string;
    icon?: ReactNode;
    className?: string;
}

/**
 * Header section for a Bento card.
 */
export function BentoCardHeader({
    title,
    subtitle,
    icon,
    className,
}: BentoCardHeaderProps) {
    return (
        <div className={cn("flex items-start gap-3 p-4", className)}>
            {icon && (
                <div className="flex h-10 w-10 items-center justify-center rounded-[5.5px] bg-white/5 border border-white/10">
                    {icon}
                </div>
            )}
            <div>
                <h3 className="font-mono text-sm font-bold text-white">{title}</h3>
                {subtitle && (
                    <p className="mt-1 font-mono text-xs text-white/50">{subtitle}</p>
                )}
            </div>
        </div>
    );
}

/**
 * Content area for a Bento card.
 */
export function BentoCardContent({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("px-4 pb-4", className)}>
            {children}
        </div>
    );
}
