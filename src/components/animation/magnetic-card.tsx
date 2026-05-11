"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { animate } from "animejs";

interface MagneticCardProps {
    children: ReactNode;
    className?: string;
    intensity?: number;
    glowColor?: string;
}

export function MagneticCard({
    children,
    className,
    intensity = 10,
    glowColor = "rgba(136, 136, 136, 0.15)",
}: MagneticCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const glowRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        // Animate card tilt
        try {
            animate(ref.current, {
                rotateY: x * intensity,
                rotateX: -y * intensity,
                duration: 300,
                easing: "easeOutQuad",
            });
        } catch (e) {
            // Fallback: apply transform directly
            ref.current.style.transform = `
        perspective(1000px)
        rotateY(${x * intensity}deg)
        rotateX(${-y * intensity}deg)
      `;
        }

        // Move glow
        if (glowRef.current) {
            const glowX = e.clientX - rect.left;
            const glowY = e.clientY - rect.top;
            glowRef.current.style.background = `radial-gradient(
        300px circle at ${glowX}px ${glowY}px,
        ${glowColor},
        transparent 60%
      )`;
        }
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;

        try {
            animate(ref.current, {
                rotateY: 0,
                rotateX: 0,
                duration: 500,
                easing: "easeOutElastic(1, .5)",
            });
        } catch (e) {
            ref.current.style.transform = "";
        }

        if (glowRef.current) {
            glowRef.current.style.background = "transparent";
        }
    };

    return (
        <div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`relative overflow-hidden ${className}`}
            style={{
                transformStyle: "preserve-3d",
                transform: "perspective(1000px)",
            }}
        >
            {/* Glow overlay */}
            <div
                ref={glowRef}
                className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            />
            {/* Content */}
            <div style={{ transform: "translateZ(20px)" }}>{children}</div>
        </div>
    );
}
