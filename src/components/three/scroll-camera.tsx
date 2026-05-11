"use client";

import { useRef, useEffect, useState, type ReactNode, type RefObject } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { animate } from "animejs";

interface ScrollCameraProps {
    /** Scroll container reference (defaults to window) */
    scrollRef?: RefObject<HTMLElement>;
    /** Starting camera Z position */
    startZ?: number;
    /** Ending camera Z position (after full scroll) */
    endZ?: number;
    /** Scroll distance in pixels to complete the transition */
    scrollDistance?: number;
    /** Enable the warp speed effect during scroll */
    enableWarp?: boolean;
    /** Callback when scroll reaches different phases */
    onPhaseChange?: (phase: 'start' | 'middle' | 'end') => void;
}

/**
 * Scroll-linked camera for React Three Fiber.
 * 
 * Creates the "dive through the cloud" scrollytelling effect.
 * The camera moves along the Z axis as the user scrolls.
 */
export function ScrollCamera({
    startZ = 12,
    endZ = 0,
    scrollDistance = 1000,
    enableWarp = true,
    onPhaseChange,
}: ScrollCameraProps) {
    const { camera } = useThree();
    const scrollProgress = useRef(0);
    const targetProgress = useRef(0);
    const velocity = useRef(0);
    const lastPhase = useRef<'start' | 'middle' | 'end'>('start');

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            targetProgress.current = Math.min(1, scrollY / scrollDistance);

            // Detect phase changes
            let newPhase: 'start' | 'middle' | 'end';
            if (targetProgress.current < 0.2) {
                newPhase = 'start';
            } else if (targetProgress.current > 0.8) {
                newPhase = 'end';
            } else {
                newPhase = 'middle';
            }

            if (newPhase !== lastPhase.current) {
                lastPhase.current = newPhase;
                onPhaseChange?.(newPhase);
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrollDistance, onPhaseChange]);

    useFrame((state, delta) => {
        // Smooth interpolation of scroll progress
        const prevProgress = scrollProgress.current;
        scrollProgress.current = THREE.MathUtils.lerp(
            scrollProgress.current,
            targetProgress.current,
            0.08
        );

        // Calculate scroll velocity for warp effect
        velocity.current = (scrollProgress.current - prevProgress) / delta;

        // Update camera position
        const z = THREE.MathUtils.lerp(startZ, endZ, scrollProgress.current);
        camera.position.z = z;

        // Optional FOV warp for speed sensation
        if (enableWarp) {
            const baseFov = 50;
            const warpFov = baseFov + Math.abs(velocity.current) * 15;
            (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(
                (camera as THREE.PerspectiveCamera).fov,
                Math.min(warpFov, 70),
                0.1
            );
            (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
        }
    });

    return null;
}

interface ScrollRevealSectionProps {
    children: ReactNode;
    className?: string;
    /** Delay before reveal (ms) */
    delay?: number;
    /** Animation duration (ms) */
    duration?: number;
    /** Threshold for intersection (0-1) */
    threshold?: number;
    /** Direction of reveal animation */
    direction?: 'up' | 'down' | 'left' | 'right' | 'fade';
}

/**
 * Section that reveals with animation when scrolled into view.
 * Uses Intersection Observer + Anime.js for smooth reveals.
 */
export function ScrollRevealSection({
    children,
    className,
    delay = 0,
    duration = 800,
    threshold = 0.1,
    direction = 'up',
}: ScrollRevealSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isRevealed, setIsRevealed] = useState(false);

    useEffect(() => {
        if (!ref.current || typeof window === "undefined") return;

        // Check for reduced motion preference
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setIsRevealed(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isRevealed) {
                    setIsRevealed(true);

                    // Initial state based on direction
                    const initialState: Record<string, number> = { opacity: 0 };
                    if (direction === 'up') initialState.translateY = 40;
                    if (direction === 'down') initialState.translateY = -40;
                    if (direction === 'left') initialState.translateX = 40;
                    if (direction === 'right') initialState.translateX = -40;

                    // Set initial state
                    Object.entries(initialState).forEach(([key, value]) => {
                        if (ref.current) {
                            if (key === 'opacity') {
                                ref.current.style.opacity = String(value);
                            } else {
                                ref.current.style.transform = `${key.replace('translate', 'translate')}(${value}px)`;
                            }
                        }
                    });

                    // Animate to final state
                    if (ref.current) {
                        animate(ref.current, {
                            opacity: 1,
                            translateY: 0,
                            translateX: 0,
                            duration,
                            delay,
                            easing: "easeOutQuart",
                        });
                    }

                    observer.disconnect();
                }
            },
            { threshold }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay, duration, threshold, direction, isRevealed]);

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: isRevealed ? undefined : 0,
                willChange: isRevealed ? undefined : "opacity, transform",
            }}
        >
            {children}
        </div>
    );
}

/**
 * Hook to track scroll progress (0-1) over a specified distance.
 */
export function useScrollProgress(scrollDistance = 1000): number {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (typeof window === "undefined") return;

        const handleScroll = () => {
            const newProgress = Math.min(1, window.scrollY / scrollDistance);
            setProgress(newProgress);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll(); // Initial value

        return () => window.removeEventListener("scroll", handleScroll);
    }, [scrollDistance]);

    return progress;
}
