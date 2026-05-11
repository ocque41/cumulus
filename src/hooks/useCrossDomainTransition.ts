import { useCallback } from 'react';
import { animate, stagger } from 'animejs';

export const useCrossDomainTransition = () => {
    const navigateTo = useCallback((url: string) => {
        // 1. Select the 'Curtain' elements (a grid of 100 divs)
        const targets = document.querySelectorAll('.transition-block');

        // 2. Play the EXIT animation (Cover the screen)
        animate(targets, {
            scale: [0, 1], // Grow from nothing to full size
            opacity: [0, 1],
            easing: 'easeInOutExpo', // Aggressive easing
            duration: 600,
            // Stagger from the center outward
            delay: stagger(50, { grid: [10, 10], from: 'center' }),
            complete: () => {
                // 3. Only when screen is fully covered, force the URL change
                window.location.assign(url);
            }
        });
    }, []);

    return { navigateTo };
};
