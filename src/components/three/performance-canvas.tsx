"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { Canvas, type CanvasProps, useThree } from "@react-three/fiber";

import { cn } from "@/lib/utils";
import { useAdaptiveQuality, getCanvasProps, useReducedMotion, type QualityLevel } from "@/hooks";

interface PerformanceCanvasProps extends Omit<CanvasProps, "children"> {
    children: ReactNode;
    className?: string;
    /** Force a specific quality level (overrides auto-detection) */
    forceQuality?: QualityLevel;
    /** Fallback content for reduced motion or unsupported devices */
    fallback?: ReactNode;
    /** Style for the wrapper div */
    wrapperStyle?: React.CSSProperties;
}

/**
 * Internal component that triggers invalidation for on-demand rendering.
 */
function OnDemandTrigger() {
    const { invalidate, clock } = useThree();
    const lastTime = useRef(0);

    useEffect(() => {
        // Force initial render
        invalidate();

        // Set up intersection observer to invalidate when visible
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                invalidate();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [invalidate]);

    // Invalidate on mouse movement for interactive scenes
    useEffect(() => {
        const handlePointer = () => {
            const now = clock.getElapsedTime();
            // Throttle to 60fps max
            if (now - lastTime.current > 0.016) {
                lastTime.current = now;
                invalidate();
            }
        };

        window.addEventListener("pointermove", handlePointer, { passive: true });
        window.addEventListener("scroll", handlePointer, { passive: true });

        return () => {
            window.removeEventListener("pointermove", handlePointer);
            window.removeEventListener("scroll", handlePointer);
        };
    }, [invalidate, clock]);

    return null;
}

/**
 * Performance-optimized Canvas wrapper with adaptive quality.
 * 
 * Features:
 * - Auto-detects device capabilities and adjusts quality
 * - On-demand rendering for low-power devices
 * - Reduced motion fallback support
 * - Visibility-based render control
 */
export function PerformanceCanvas({
    children,
    className,
    forceQuality,
    fallback,
    wrapperStyle,
    ...canvasProps
}: PerformanceCanvasProps) {
    const { level, config, isReducedMotion } = useAdaptiveQuality();
    const effectiveLevel = forceQuality ?? level;
    const adaptiveProps = getCanvasProps(effectiveLevel);

    // Show fallback for reduced motion if provided
    if (isReducedMotion && fallback) {
        return <>{fallback}</>;
    }

    // Show fallback for minimal quality if provided
    if (effectiveLevel === "minimal" && fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className={cn("relative", className)} style={wrapperStyle}>
            <Canvas
                {...canvasProps}
                {...adaptiveProps}
            >
                {/* On-demand render trigger */}
                {config.frameloop === "demand" && <OnDemandTrigger />}

                {children}
            </Canvas>

            {/* Quality indicator (dev only) */}
            {process.env.NODE_ENV === "development" && (
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 backdrop-blur rounded text-[10px] font-mono text-white/60 uppercase tracking-wider">
                    Q: {effectiveLevel}
                </div>
            )}
        </div>
    );
}

/**
 * Wrapper for any component that should respect reduced motion.
 */
export function MotionSafe({
    children,
    fallback,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const prefersReducedMotion = useReducedMotion();

    if (prefersReducedMotion) {
        return <>{fallback ?? null}</>;
    }

    return <>{children}</>;
}
