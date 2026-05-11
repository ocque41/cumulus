"use client";

import { useEffect, useRef, type ReactNode, Children } from "react";
import { animate, stagger } from "animejs";

interface StaggerListProps {
    children: ReactNode;
    delay?: number;
    staggerDelay?: number;
    duration?: number;
    className?: string;
    itemClassName?: string;
    as?: "ul" | "ol" | "div";
}

export function StaggerList({
    children,
    delay = 0,
    staggerDelay = 80,
    duration = 500,
    className,
    itemClassName,
    as: Tag = "ul",
}: StaggerListProps) {
    const ref = useRef<HTMLElement>(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !ref.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            const items = ref.current.querySelectorAll("[data-stagger-item]");
            items.forEach((item) => {
                (item as HTMLElement).style.opacity = "1";
            });
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    hasAnimated.current = true;
                    const items = ref.current?.querySelectorAll("[data-stagger-item]");
                    if (items && items.length > 0) {
                        try {
                            animate(items, {
                                opacity: [0, 1],
                                translateY: [20, 0],
                                delay: stagger(staggerDelay, { start: delay }),
                                duration,
                                easing: "easeOutQuad",
                            });
                        } catch (e) {
                            items.forEach((item) => {
                                (item as HTMLElement).style.opacity = "1";
                            });
                        }
                    }
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay, staggerDelay, duration]);

    const items = Children.toArray(children);

    return (
        <Tag ref={ref as any} className={className}>
            {items.map((child, index) => (
                <div
                    key={index}
                    data-stagger-item
                    className={itemClassName}
                    style={{ opacity: 0 }}
                >
                    {child}
                </div>
            ))}
        </Tag>
    );
}
