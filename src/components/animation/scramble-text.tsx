"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate } from "animejs";

interface ScrambleTextProps {
    children: string;
    className?: string;
    scrambleDuration?: number;
    delay?: number;
    triggerOnView?: boolean;
    chars?: string;
}

const DEFAULT_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄";

export function ScrambleText({
    children,
    className,
    scrambleDuration = 1500,
    delay = 0,
    triggerOnView = true,
    chars = DEFAULT_CHARS,
}: ScrambleTextProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [displayText, setDisplayText] = useState(
        children.split("").map(() => chars[Math.floor(Math.random() * chars.length)]).join("")
    );
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !ref.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setDisplayText(children);
            return;
        }

        const runAnimation = () => {
            if (hasAnimated.current) return;
            hasAnimated.current = true;

            const originalText = children;
            const textLength = originalText.length;
            const duration = scrambleDuration;
            const startTime = Date.now() + delay;

            const scramble = () => {
                const elapsed = Date.now() - startTime;
                if (elapsed < 0) {
                    requestAnimationFrame(scramble);
                    return;
                }

                const progress = Math.min(elapsed / duration, 1);
                const revealedCount = Math.floor(progress * textLength);

                let result = "";
                for (let i = 0; i < textLength; i++) {
                    if (i < revealedCount) {
                        result += originalText[i];
                    } else if (originalText[i] === " ") {
                        result += " ";
                    } else {
                        result += chars[Math.floor(Math.random() * chars.length)];
                    }
                }

                setDisplayText(result);

                if (progress < 1) {
                    requestAnimationFrame(scramble);
                }
            };

            requestAnimationFrame(scramble);
        };

        if (triggerOnView) {
            const observer = new IntersectionObserver(
                ([entry]) => {
                    if (entry.isIntersecting) {
                        runAnimation();
                        observer.disconnect();
                    }
                },
                { threshold: 0.3 }
            );
            observer.observe(ref.current);
            return () => observer.disconnect();
        } else {
            runAnimation();
        }
    }, [children, scrambleDuration, delay, triggerOnView, chars]);

    return (
        <span ref={ref} className={className}>
            {displayText}
        </span>
    );
}
