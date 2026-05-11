"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { animate, stagger, set } from 'animejs';

export const TransitionCurtain = () => {
    const curtainRef = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    // ENTRANCE ANIMATION (Reveal the new page)
    useEffect(() => {
        const enter = () => {
            if (!curtainRef.current) return;

            // We need to wait for the DOM to be fully ready
            const targets = curtainRef.current.querySelectorAll('.transition-block');

            // Initial State: The screen is blocked (Scale 1)
            set(targets, { scale: 1, opacity: 1 });

            // Animate OUT (Reveal)
            animate(targets, {
                scale: [1, 0], // Shrink blocks to reveal content
                opacity: [1, 0],
                duration: 800,
                easing: 'easeOutExpo',
                // Stagger from center, creating a 'portal' opening effect
                delay: stagger(30, { grid: [10, 10], from: 'center' })
            });
        };

        // Run on mount and path change
        enter();

        // Run on back/forward cache restore
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                enter();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        return () => {
            window.removeEventListener('pageshow', handlePageShow);
        };
    }, [pathname]);

    return (
        <div
            ref={curtainRef}
            className="fixed inset-0 z-[9999] pointer-events-none grid grid-cols-10 grid-rows-10"
        >
            {Array.from({ length: 100 }).map((_, i) => (
                <div
                    key={i}
                    className="transition-block w-full h-full bg-black border border-zinc-900"
                />
            ))}
        </div>
    );
};
