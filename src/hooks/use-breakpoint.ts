"use client";

import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet" | "desktop";

// Breakpoint thresholds matching Tailwind defaults
const BREAKPOINTS = {
    mobile: 0,
    tablet: 768,
    desktop: 1024,
} as const;

/**
 * Hook for tracking current breakpoint for responsive animation configs.
 * 
 * @returns Current breakpoint: 'mobile' | 'tablet' | 'desktop'
 */
export function useBreakpoint(): Breakpoint {
    const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");

    useEffect(() => {
        const updateBreakpoint = () => {
            const width = window.innerWidth;

            if (width >= BREAKPOINTS.desktop) {
                setBreakpoint("desktop");
            } else if (width >= BREAKPOINTS.tablet) {
                setBreakpoint("tablet");
            } else {
                setBreakpoint("mobile");
            }
        };

        // Initial check
        updateBreakpoint();

        window.addEventListener("resize", updateBreakpoint, { passive: true });
        return () => window.removeEventListener("resize", updateBreakpoint);
    }, []);

    return breakpoint;
}

/**
 * Helper to get animation config based on breakpoint
 */
export function getResponsiveValue<T>(
    breakpoint: Breakpoint,
    values: { mobile: T; tablet?: T; desktop: T }
): T {
    if (breakpoint === "mobile") return values.mobile;
    if (breakpoint === "tablet") return values.tablet ?? values.desktop;
    return values.desktop;
}
