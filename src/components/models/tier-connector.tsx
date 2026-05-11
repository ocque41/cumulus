"use client";

import { useRef, useEffect, useState } from "react";
import { animate } from "animejs";

interface TierConnectorProps {
    className?: string;
}

export function TierConnector({ className }: TierConnectorProps) {
    const pathRef = useRef<SVGPathElement>(null);
    const dotsRef = useRef<(SVGCircleElement | null)[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.2 }
        );

        if (pathRef.current) {
            observer.observe(pathRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || !pathRef.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            pathRef.current.style.strokeDashoffset = "0";
            return;
        }

        const path = pathRef.current;
        const length = path.getTotalLength();

        path.style.strokeDasharray = `${length}`;
        path.style.strokeDashoffset = `${length}`;

        // Draw path animation
        animate(path, {
            strokeDashoffset: [length, 0],
            duration: 2000,
            easing: "easeInOutQuart",
        });

        // Animate dots appearing
        dotsRef.current.forEach((dot, i) => {
            if (dot) {
                animate(dot, {
                    opacity: [0, 1],
                    scale: [0, 1],
                    duration: 400,
                    delay: 800 + i * 400,
                    easing: "easeOutBack",
                });
            }
        });
    }, [isVisible]);

    return (
        <svg
            className={`w-full h-16 ${className}`}
            viewBox="0 0 800 60"
            preserveAspectRatio="xMidYMid meet"
        >
            {/* Connection path */}
            <path
                ref={pathRef}
                d="M 100 30 Q 250 10 400 30 Q 550 50 700 30"
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
                strokeLinecap="round"
            />

            {/* Tier dots */}
            <circle
                ref={(el) => { dotsRef.current[0] = el; }}
                cx="100"
                cy="30"
                r="6"
                fill="#141414"
                stroke="rgba(255,255,255,0.4)"
                strokeWidth="2"
                opacity="0"
            />
            <circle
                ref={(el) => { dotsRef.current[1] = el; }}
                cx="400"
                cy="30"
                r="8"
                fill="#141414"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="2"
                opacity="0"
            />
            <circle
                ref={(el) => { dotsRef.current[2] = el; }}
                cx="700"
                cy="30"
                r="10"
                fill="#141414"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="2"
                opacity="0"
            />
        </svg>
    );
}
