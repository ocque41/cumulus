"use client";

import { useEffect, useRef, type RefObject } from "react";
import { animate, createSpring } from "animejs";

interface UseMagneticOptions {
    /** Strength of the magnetic pull (0-1). Default: 0.35 */
    intensity?: number;
    /** Stiffness of the return spring. Default: 300 */
    stiffness?: number;
    /** Damping of the return spring. Default: 15 */
    damping?: number;
    /** Whether the effect is disabled */
    disabled?: boolean;
}

/**
 * Hook to apply magnetic cursor attraction to an element.
 * The element will pull towards the cursor when hovered.
 */
export function useMagnetic(
    ref: RefObject<HTMLElement | null>,
    options: UseMagneticOptions = {}
) {
    const {
        intensity = 0.35,
        stiffness = 300,
        damping = 15,
        disabled = false
    } = options;

    // Track state to avoid animations fighting
    const isHovered = useRef(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || disabled) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isHovered.current) return;

            const rect = element.getBoundingClientRect();
            // Calculate distance from center
            const x = (e.clientX - rect.left - rect.width / 2) * intensity;
            const y = (e.clientY - rect.top - rect.height / 2) * intensity;

            // Immediate response for magnetic feel
            animate(element, {
                x: x,
                y: y,
                duration: 50, // Very fast, almost direct
                easing: "linear",
            });
        };

        const handleMouseEnter = () => {
            isHovered.current = true;
        };

        const handleMouseLeave = () => {
            isHovered.current = false;

            // Spring back to origin
            animate(element, {
                x: 0,
                y: 0,
                ease: createSpring({ stiffness, damping }),
            });
        };

        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseenter", handleMouseEnter);
        element.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            element.removeEventListener("mousemove", handleMouseMove);
            element.removeEventListener("mouseenter", handleMouseEnter);
            element.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [ref, intensity, stiffness, damping, disabled]);
}
