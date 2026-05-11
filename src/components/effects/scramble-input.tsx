"use client";

import { useRef, useEffect, useState } from "react";

interface ScrambleInputProps {
    placeholder?: string;
    className?: string;
    type?: string;
    name?: string;
    id?: string;
}

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?~`";

export function ScrambleInput({
    placeholder = "",
    className = "",
    type = "text",
    name,
    id,
}: ScrambleInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [displayPlaceholder, setDisplayPlaceholder] = useState(placeholder);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setDisplayPlaceholder(placeholder);
            return;
        }

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) return;

        // Scramble effect when focused
        let iteration = 0;
        const interval = setInterval(() => {
            setDisplayPlaceholder(
                placeholder
                    .split("")
                    .map((char, i) => {
                        if (i < iteration) return placeholder[i];
                        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
                    })
                    .join("")
            );
            iteration += 0.5;
            if (iteration >= placeholder.length) {
                clearInterval(interval);
                setDisplayPlaceholder(placeholder);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [isFocused, placeholder]);

    return (
        <input
            ref={inputRef}
            type={type}
            name={name}
            id={id}
            placeholder={displayPlaceholder}
            className={className}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
        />
    );
}
