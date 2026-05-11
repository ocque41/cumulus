"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { HeroButton } from "@/components/site/hero-button";
import { AnimatedHero } from "@/components/animation";
import { ViewTunnelIn } from "@/components/core";
import { VoxelCloud } from "@/components/three";
import { useReducedMotion, useAdaptiveQuality, getAdaptiveInstanceCount } from "@/hooks";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRef, useEffect, useState } from "react";

/**
 * Upgraded Hero component with Antigravity VoxelCloud.
 * 
 * Uses ViewTunnel to project the 3D cloud into the global Canvas
 * while keeping DOM content interactive.
 */
export function AntigravityHero() {
    const prefersReducedMotion = useReducedMotion();
    const { level } = useAdaptiveQuality();
    const isMobile = useIsMobile();
    const pointerAnimated = useRef({ x: 0, y: 0, z: 0 });
    const [isClient, setIsClient] = useState(false);

    // Client-side only rendering for date
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Pointer tracking for VoxelCloud repulsion
    useEffect(() => {
        if (prefersReducedMotion || typeof window === "undefined") return;

        const handlePointerMove = (event: PointerEvent) => {
            const targetX = (event.clientX / window.innerWidth - 0.5) * 12;
            const targetY = -(event.clientY / window.innerHeight - 0.5) * 8;

            // Directly update ref for performance (VoxelCloud interpolates physics)
            pointerAnimated.current.x = targetX;
            pointerAnimated.current.y = targetY;
            pointerAnimated.current.z = 0;
        };

        window.addEventListener("pointermove", handlePointerMove);
        return () => window.removeEventListener("pointermove", handlePointerMove);
    }, [prefersReducedMotion]);

    const now = new Date();
    const formatted = new Intl.DateTimeFormat("en", {
        month: "long",
        day: "2-digit",
        year: "numeric",
    }).format(now);

    const voxelCount = getAdaptiveInstanceCount(isMobile ? 1000 : 2500, level);

    return (
        <section className="container relative isolate flex h-[calc(100vh-6rem)] -mt-12 flex-col items-center justify-center overflow-hidden text-center">
            {/* 3D VoxelCloud - tunneled to global Canvas */}
            {!prefersReducedMotion && (
                <ViewTunnelIn>
                    <VoxelCloud
                        count={voxelCount}
                        spread={isMobile ? 6 : 10} // Tighter spread on mobile
                        mousePosition={pointerAnimated}
                        repulsionStrength={0.8}
                        repulsionRadius={3.5}
                    />
                </ViewTunnelIn>
            )}

            {/* Fallback gradient for reduced motion */}
            {prefersReducedMotion && (
                <div
                    className="absolute inset-0 -z-10"
                    style={{
                        background:
                            "radial-gradient(circle at 50% 40%, rgba(222,221,217,0.15), transparent 70%)",
                    }}
                    aria-hidden
                />
            )}

            <AnimatedHero className="flex flex-col items-center text-center">
                <div
                    data-hero-eyebrow
                    className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[color:var(--muted)]"
                    style={{ opacity: 0 }}
                >
                    {isClient && (
                        <>
                            <time
                                dateTime={now.toISOString()}
                                className="tracking-widest uppercase text-xs font-medium"
                            >
                                {formatted}
                            </time>
                            <span aria-hidden className="opacity-60">
                                •
                            </span>
                        </>
                    )}
                    <span className="uppercase tracking-[0.3em] text-xs font-semibold text-[color:var(--title)]">
                        Product Customization
                    </span>
                </div>

                <h1
                    data-hero-title
                    className="display max-w-5xl mb-8 text-center text-4xl md:text-6xl lg:text-7xl" // Responsive font sizes
                    style={{ opacity: 0 }}
                >
                    AI for Ecommerce Boutiques
                </h1>

                <div
                    data-hero-description
                    className="max-w-3xl space-y-6 lead mb-12 text-center"
                    style={{ opacity: 0 }}
                >
                    <p>The ecosystem for AI Automation</p>
                </div>

                <div
                    data-hero-cta
                    className="flex flex-wrap justify-center gap-4 -mt-4 opacity-0"
                    style={{ opacity: 0 }}
                >
                    <HeroButton href="/login">Get Started</HeroButton>
                </div>
            </AnimatedHero>
        </section>
    );
}
