"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "animejs";

interface ScrollRevealProps {
    children: ReactNode;
    delay?: number;
    duration?: number;
    className?: string;
    direction?: "up" | "down" | "left" | "right";
}

export function ScrollReveal({
    children,
    delay = 0,
    duration = 600,
    className,
    direction = "up",
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !ref.current) return;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            ref.current.style.opacity = "1";
            return;
        }

        const translateMap = {
            up: { translateY: [30, 0] },
            down: { translateY: [-30, 0] },
            left: { translateX: [50, 0] },
            right: { translateX: [-50, 0] },
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const element = ref.current;
                    if (element) {
                        try {
                            animate(element, {
                                opacity: [0, 1],
                                ...translateMap[direction],
                                delay,
                                duration,
                                easing: "easeOutQuad",
                            });
                        } catch (e) {
                            // Fallback: just show the element
                            element.style.opacity = "1";
                        }
                    }
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay, duration, direction]);

    return (
        <div ref={ref} className={className} style={{ opacity: 0 }}>
            {children}
        </div>
    );
}
