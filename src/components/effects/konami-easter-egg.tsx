"use client";

import { useEffect, useState, useCallback } from "react";
import { animate, stagger } from "animejs";

interface KonamiEasterEggProps {
    children?: React.ReactNode;
}

const KONAMI_CODE = [
    "ArrowUp", "ArrowUp",
    "ArrowDown", "ArrowDown",
    "ArrowLeft", "ArrowRight",
    "ArrowLeft", "ArrowRight",
    "KeyB", "KeyA"
];

export function KonamiEasterEgg({ children }: KonamiEasterEggProps) {
    const [inputSequence, setInputSequence] = useState<string[]>([]);
    const [isActivated, setIsActivated] = useState(false);

    const triggerEasterEgg = useCallback(() => {
        setIsActivated(true);

        // Create floating symbols
        const symbols = ["☁", "∞", "◎", "⌘", "▦", "∑", "◈"];
        const container = document.body;

        symbols.forEach((symbol, i) => {
            const el = document.createElement("div");
            el.textContent = symbol;
            el.className = "konami-symbol fixed pointer-events-none font-mono text-4xl text-white/50 z-[9999]";
            el.style.left = `${Math.random() * 100}vw`;
            el.style.top = `100vh`;
            container.appendChild(el);

            animate(el, {
                translateY: [0, -window.innerHeight - 100],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
                scale: [0, 1, 0.5],
                opacity: [0, 1, 0],
                duration: 3000 + Math.random() * 2000,
                delay: i * 150,
                easing: "easeOutQuart",
                onComplete: () => {
                    el.remove();
                    if (i === symbols.length - 1) {
                        setIsActivated(false);
                    }
                },
            });
        });

        // Flash effect
        const flash = document.createElement("div");
        flash.className = "fixed inset-0 bg-white z-[9998] pointer-events-none";
        container.appendChild(flash);

        animate(flash, {
            opacity: [0.8, 0],
            duration: 500,
            easing: "easeOutExpo",
            onComplete: () => flash.remove(),
        });

        // Console message
        console.log(`
    ☁️ CUMULUS EASTER EGG ACTIVATED ☁️
    
    You found the secret! 
    Welcome to the cloud ecosystem.
    
    ∞ ◎ ⌘ ▦ ∑ ◈
    `);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const newSequence = [...inputSequence, e.code].slice(-KONAMI_CODE.length);
            setInputSequence(newSequence);

            if (newSequence.join(",") === KONAMI_CODE.join(",")) {
                triggerEasterEgg();
                setInputSequence([]);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [inputSequence, triggerEasterEgg]);

    return <>{children}</>;
}
