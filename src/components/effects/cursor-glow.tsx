"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "animejs";

export function CursorGlow() {
    const glowRef = useRef<HTMLDivElement>(null);
    const trailsRef = useRef<HTMLDivElement[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient || !glowRef.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) return;

        let mouseX = 0;
        let mouseY = 0;
        let currentX = 0;
        let currentY = 0;

        const handleMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        // Smooth follow animation
        const followCursor = () => {
            const ease = 0.15;
            currentX += (mouseX - currentX) * ease;
            currentY += (mouseY - currentY) * ease;

            if (glowRef.current) {
                glowRef.current.style.transform = `translate(${currentX - 100}px, ${currentY - 100}px)`;
            }

            // Update trail positions with stagger
            trailsRef.current.forEach((trail, i) => {
                if (trail) {
                    const trailEase = 0.08 - i * 0.015;
                    const trailX = currentX - (mouseX - currentX) * (i + 1) * 0.3;
                    const trailY = currentY - (mouseY - currentY) * (i + 1) * 0.3;
                    trail.style.transform = `translate(${trailX - 50 + i * 10}px, ${trailY - 50 + i * 10}px)`;
                }
            });

            requestAnimationFrame(followCursor);
        };

        window.addEventListener("mousemove", handleMouseMove);
        document.body.addEventListener("mouseleave", handleMouseLeave);
        followCursor();

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.body.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isClient]);

    if (!isClient) return null;

    return (
        <>
            {/* Main glow */}
            <div
                ref={glowRef}
                className="pointer-events-none fixed z-50 h-[200px] w-[200px] rounded-full transition-opacity duration-300"
                style={{
                    background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
                    opacity: isVisible ? 1 : 0,
                    filter: "blur(40px)",
                }}
            />
            {/* Trail particles */}
            {[0, 1, 2].map((i) => (
                <div
                    key={i}
                    ref={(el) => { if (el) trailsRef.current[i] = el; }}
                    className="pointer-events-none fixed z-40 rounded-full transition-opacity duration-500"
                    style={{
                        width: `${100 - i * 25}px`,
                        height: `${100 - i * 25}px`,
                        background: `radial-gradient(circle, rgba(255,255,255,${0.04 - i * 0.01}) 0%, transparent 70%)`,
                        opacity: isVisible ? 1 : 0,
                        filter: `blur(${20 + i * 10}px)`,
                    }}
                />
            ))}
        </>
    );
}
