"use client";

import { useRef, useEffect } from "react";
import { animate } from "animejs";

interface BreathingElementProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
    duration?: number;
}

export function BreathingElement({
    children,
    className = "",
    intensity = 0.02,
    duration = 4000,
}: BreathingElementProps) {
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!elementRef.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) return;

        const animation = animate(elementRef.current, {
            scale: [1, 1 + intensity, 1],
            opacity: [1, 0.9, 1],
            duration,
            loop: true,
            easing: "inOutSine",
        });

        return () => {
            animation.pause();
        };
    }, [intensity, duration]);

    return (
        <div ref={elementRef} className={className}>
            {children}
        </div>
    );
}
