"use client";

import { useEffect, useRef, type RefObject } from "react";
import { animate, createSpring } from "animejs";

interface UseTiltOptions {
    /** Maximum tilt angle in degrees. Default: 5 */
    maxTilt?: number;
    /** Whether to scale the element on hover. Default: 1.02 */
    scale?: number;
    /** Perspective value for 3D effect. Default: 1000 */
    perspective?: number;
    /** Whether the effect is disabled */
    disabled?: boolean;
}

/**
 * Hook to apply a 3D tilt effect to an element based on cursor position.
 */
export function useTilt(
    ref: RefObject<HTMLElement | null>,
    options: UseTiltOptions = {}
) {
    const {
        maxTilt = 5,
        scale = 1.02,
        perspective = 1000,
        disabled = false
    } = options;

    const isHovered = useRef(false);

    useEffect(() => {
        const element = ref.current;
        if (!element || disabled) return;

        // Ensure parent perspective
        element.style.transformStyle = "preserve-3d";
        if (element.parentElement) {
            element.parentElement.style.perspective = `${perspective}px`;
        }

        const handleMouseMove = (e: MouseEvent) => {
            if (!isHovered.current) return;

            const rect = element.getBoundingClientRect();
            // Calculate normalized position (-1 to 1)
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const mouseX = e.clientX - centerX;
            const mouseY = e.clientY - centerY;

            const rotateX = -(mouseY / (rect.height / 2)) * maxTilt;
            const rotateY = (mouseX / (rect.width / 2)) * maxTilt;

            animate(element, {
                rotateX: rotateX,
                rotateY: rotateY,
                duration: 50,
                easing: "linear",
            });
        };

        const handleMouseEnter = () => {
            isHovered.current = true;
            animate(element, {
                scale: scale,
                duration: 400,
                ease: "easeOutCubic"
            });
        };

        const handleMouseLeave = () => {
            isHovered.current = false;
            // Spring back
            animate(element, {
                rotateX: 0,
                rotateY: 0,
                scale: 1,
                ease: createSpring({ stiffness: 300, damping: 20 }),
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
    }, [ref, maxTilt, scale, perspective, disabled]);
}
