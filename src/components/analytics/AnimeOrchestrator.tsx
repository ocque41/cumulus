"use client";

import { useEffect } from "react";
// @ts-ignore
import { animate, createTimeline, stagger } from "animejs";

// Utility for line drawing animation
const setDashoffset = (el: any) => {
    const pathLength = el.getTotalLength();
    el.setAttribute('stroke-dasharray', pathLength);
    return pathLength;
};

export function AnimeOrchestrator() {
    useEffect(() => {
        // 1. Initial Timeline - The "Big Bang"
        const timeline = createTimeline({
            defaults: {
                // @ts-ignore
                easing: "easeOutElastic(1, .6)",
                duration: 1000,
            },
        });

        timeline
            // Header Glitch Entrace
            .add(".analytics-title", {
                translateY: [-50, 0],
                opacity: [0, 1],
                scale: [0.5, 1],
                filter: ["blur(10px)", "blur(0px)"],
                duration: 800,
            })
            // Glitch shake
            .add(
                ".analytics-title",
                {
                    translateX: [0, -5, 5, -5, 0],
                    skewX: [0, 10, -10, 0],
                    duration: 400,
                    easing: "steps(5)",
                },
                "-=400"
            )

            // Data "Growth" - Crazy part
            // Targeting Recharts internals via class selectors
            .add(
                ".recharts-bar-rectangle",
                {
                    scaleY: [0, 1],
                    opacity: [0, 1],
                    delay: stagger(50),
                    easing: "spring(1, 80, 10, 0)",
                },
                "-=800"
            )
            .add(
                ".recharts-curve", // Lines
                {
                    strokeDashoffset: [setDashoffset, 0],
                    opacity: [0, 1],
                    delay: stagger(100),
                    easing: "easeOutCubic",
                    duration: 1500,
                },
                "-=1000"
            )
            .add(
                ".recharts-pie-sector", // Pie slices
                {
                    scale: [0, 1],
                    rotate: [-90, 0],
                    opacity: [0, 1],
                    delay: stagger(50),
                },
                "-=1200"
            );

        // 2. Interactive "Levitation" System
        // We add listeners to all cards for a crazy hover effect
        const cards = document.querySelectorAll(".analytics-card");
        cards.forEach((card) => {
            card.addEventListener("mouseenter", () => {
                animate(card, {
                    scale: 1.05,
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                    translateY: -10,
                    borderColor: "#3b82f6", // Blue glow
                    duration: 400,
                    easing: "easeOutExpo",
                });
            });
            card.addEventListener("mouseleave", () => {
                animate(card, {
                    scale: 1,
                    boxShadow: "0 0px 0px 0px rgba(0, 0, 0, 0)",
                    translateY: 0,
                    borderColor: "rgba(255,255,255,0.1)", // Default border
                    duration: 600,
                    easing: "easeOutElastic(1, .5)",
                });
            });
        });

        return () => {
            // Cleanup if necessary, though simple animations naturally end.
            // Listeners might stick around but page unmount usually clears DOM.
        };
    }, []);

    return null; // Logic only component
}
