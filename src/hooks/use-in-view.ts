"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
/**
 * Hook to detect when an element enters the viewport.
 * Used for entrance animations that trigger once when in view.
 * 
 * @param options - IntersectionObserver options
 * @returns [ref, isInView] - Attach ref to element, isInView triggers animation
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
    options: IntersectionObserverInit = {}
): [RefObject<T | null>, boolean] {
    const ref = useRef<T | null>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // Once in view, stay in view (don't re-trigger on scroll back)
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect(); // Stop observing after first trigger
                }
            },
            {
                threshold: options.threshold ?? 0.1,
                rootMargin: options.rootMargin ?? "0px",
                ...options,
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [options.threshold, options.rootMargin]);

    return [ref, isInView];
}

/**
 * Hook variant that allows re-triggering (for elements that may exit and re-enter).
 */
export function useInViewRepeating<T extends HTMLElement = HTMLDivElement>(
    options: IntersectionObserverInit = {}
): [RefObject<T | null>, boolean] {
    const ref = useRef<T | null>(null);
    const [isInView, setIsInView] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsInView(entry.isIntersecting);
            },
            {
                threshold: options.threshold ?? 0.1,
                rootMargin: options.rootMargin ?? "0px",
                ...options,
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [options.threshold, options.rootMargin]);

    return [ref, isInView];
}
