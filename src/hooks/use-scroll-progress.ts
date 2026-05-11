"use client";

import { useEffect, useState, useCallback, type RefObject } from "react";

/**
 * Hook for tracking normalized scroll progress [0,1] within a section.
 * Uses requestAnimationFrame for smooth seeking.
 * 
 * @param sectionRef - Ref to the scrollable section container
 * @param trackHeight - Height of scroll track in vh units (default: 6)
 * @returns Normalized progress value between 0 and 1
 */
export function useScrollProgress(
    sectionRef: RefObject<HTMLElement | null>,
    trackHeight: number = 6
): number {
    const [progress, setProgress] = useState(0);

    const updateProgress = useCallback(() => {
        if (!sectionRef.current) return;

        const section = sectionRef.current;
        const rect = section.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const sectionHeight = viewportHeight * trackHeight;

        // Calculate how far into the section we've scrolled
        // When section top hits viewport top, progress starts
        // When section bottom - viewport height is reached, progress ends
        const scrollableDistance = sectionHeight - viewportHeight;
        const scrolled = -rect.top;

        // Clamp progress between 0 and 1
        const rawProgress = scrolled / scrollableDistance;
        const clampedProgress = Math.max(0, Math.min(1, rawProgress));

        setProgress(clampedProgress);
    }, [sectionRef, trackHeight]);

    useEffect(() => {
        let rafId: number;
        let ticking = false;

        const handleScroll = () => {
            if (!ticking) {
                rafId = requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Initial calculation
        updateProgress();

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll, { passive: true });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
            cancelAnimationFrame(rafId);
        };
    }, [updateProgress]);

    return progress;
}
