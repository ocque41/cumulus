"use client";

import { useRef, useEffect, useState, useMemo } from "react";
import { animate, stagger } from "animejs";

interface CloudParticlesProps {
    count?: number;
    className?: string;
}

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    speed: number;
}

export function CloudParticles({ count = 40, className }: CloudParticlesProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<(HTMLDivElement | null)[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    // Generate random particles
    const particles = useMemo<Particle[]>(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            opacity: Math.random() * 0.3 + 0.1,
            speed: Math.random() * 20 + 10,
        }));
    }, [count]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) return;

        // Animate each particle with drift
        particlesRef.current.forEach((particle, i) => {
            if (!particle) return;

            const p = particles[i];
            const duration = p.speed * 1000;

            // Vertical drift - floating upward
            animate(particle, {
                translateY: [0, -50, -30, -60, 0],
                translateX: [0, 15, -10, 20, 0],
                opacity: [p.opacity, p.opacity * 1.5, p.opacity * 0.8, p.opacity * 1.2, p.opacity],
                duration: duration,
                delay: i * 100,
                easing: "easeInOutSine",
                loop: true,
            });
        });
    }, [isVisible, particles]);

    return (
        <div
            ref={containerRef}
            className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        >
            {particles.map((p, i) => (
                <div
                    key={p.id}
                    ref={(el) => {
                        particlesRef.current[i] = el;
                    }}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        opacity: p.opacity,
                    }}
                />
            ))}
        </div>
    );
}
