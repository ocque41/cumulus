"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { animate } from "animejs";

interface AnimatedHeroProps {
    children: ReactNode;
    className?: string;
}

export function AnimatedHero({ children, className }: AnimatedHeroProps) {
    const ref = useRef<HTMLDivElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !ref.current || hasAnimated.current) return;
        hasAnimated.current = true;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            const elements = ref.current.querySelectorAll("[data-hero-animate]");
            elements.forEach((el) => {
                (el as HTMLElement).style.opacity = "1";
                (el as HTMLElement).style.transform = "none";
            });
            return;
        }

        const eyebrow = ref.current.querySelector("[data-hero-eyebrow]");
        const title = ref.current.querySelector("[data-hero-title]");
        const description = ref.current.querySelector("[data-hero-description]");
        const cta = ref.current.querySelector("[data-hero-cta]");

        const timeline: Array<{ target: Element | null; delay: number; props: object }> = [
            {
                target: eyebrow,
                delay: 200,
                props: { opacity: [0, 1], translateY: [-20, 0] },
            },
            {
                target: title,
                delay: 400,
                props: { opacity: [0, 1], scale: [0.95, 1], filter: ["blur(8px)", "blur(0px)"] },
            },
            {
                target: description,
                delay: 600,
                props: { opacity: [0, 1], translateY: [20, 0] },
            },
            {
                target: cta,
                delay: 800,
                props: { opacity: [0, 1], scale: [0.9, 1.02, 1] },
            },
        ];

        timeline.forEach(({ target, delay, props }) => {
            if (target) {
                try {
                    animate(target, {
                        ...props,
                        delay,
                        duration: 600,
                        easing: "easeOutQuad",
                    });
                } catch (e) {
                    (target as HTMLElement).style.opacity = "1";
                }
            }
        });
    }, []);

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    );
}
