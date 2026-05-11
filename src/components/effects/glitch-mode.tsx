"use client";

import { useEffect, useState, useCallback } from "react";
import { animate } from "animejs";

export function GlitchModeProvider({ children }: { children: React.ReactNode }) {
    const [isGlitchMode, setIsGlitchMode] = useState(false);

    const applyGlitchEffect = useCallback(() => {
        // Add glitch class to body
        document.body.classList.add("glitch-mode");

        // Glitch all text elements randomly
        const textElements = document.querySelectorAll("h1, h2, h3, h4, p, span, a");

        textElements.forEach((el, i) => {
            if (Math.random() > 0.7) {
                animate(el, {
                    translateX: [0, (Math.random() - 0.5) * 10, 0],
                    filter: [
                        "none",
                        `hue-rotate(${Math.random() * 360}deg)`,
                        "none"
                    ],
                    duration: 100 + Math.random() * 200,
                    delay: i * 10,
                    loop: 3,
                });
            }
        });

        // Random color shift
        const colorShift = document.createElement("div");
        colorShift.className = "fixed inset-0 pointer-events-none z-[9999]";
        colorShift.style.mixBlendMode = "exclusion";
        document.body.appendChild(colorShift);

        animate(colorShift, {
            backgroundColor: [
                "rgba(255,0,0,0)",
                "rgba(255,0,0,0.1)",
                "rgba(0,255,255,0.1)",
                "rgba(0,0,0,0)",
            ],
            duration: 500,
            easing: "steps(4)",
            onComplete: () => colorShift.remove(),
        });
    }, []);

    const removeGlitchEffect = useCallback(() => {
        document.body.classList.remove("glitch-mode");
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // ⌘/Ctrl + G to toggle
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
                e.preventDefault();
                setIsGlitchMode((prev) => !prev);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    useEffect(() => {
        if (isGlitchMode) {
            applyGlitchEffect();

            // Periodic glitch bursts
            const interval = setInterval(applyGlitchEffect, 3000);
            return () => {
                clearInterval(interval);
                removeGlitchEffect();
            };
        } else {
            removeGlitchEffect();
        }
    }, [isGlitchMode, applyGlitchEffect, removeGlitchEffect]);

    return (
        <>
            {children}
            {isGlitchMode && (
                <div className="fixed bottom-4 right-4 z-[9999] rounded-full bg-white/10 px-4 py-2 font-mono text-xs text-white/80 backdrop-blur-sm">
                    GLITCH MODE — ⌘G to exit
                </div>
            )}
        </>
    );
}
