"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { animate, Timeline } from "animejs";
import { cn } from "@/lib/utils";

interface HeroButtonProps {
    href: string;
    children: React.ReactNode;
    className?: string;
}

export function HeroButton({ href, children, className }: HeroButtonProps) {
    const buttonRef = useRef<HTMLAnchorElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }, []);

    // Magnetic Effect
    useEffect(() => {
        const btn = buttonRef.current;
        if (!btn || isTouch) return;

        const handleMouseMove = (e: MouseEvent) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Magnetic pull (stronger closer to center)
            animate(btn, {
                translateX: x * 0.4,
                translateY: y * 0.4,
                scale: 1.1,
                duration: 800,
                easing: "easeOutElastic(1, .5)",
            });

            // Text moves slightly less for parallax depth
            if (textRef.current) {
                animate(textRef.current, {
                    translateX: x * 0.1,
                    translateY: y * 0.1,
                    duration: 800,
                    easing: "easeOutElastic(1, .5)",
                });
            }
        };

        const handleMouseLeave = () => {
            animate(btn, {
                translateX: 0,
                translateY: 0,
                scale: 1,
                duration: 600,
                easing: "easeOutElastic(1, .5)",
            });
            if (textRef.current) {
                animate(textRef.current, {
                    translateX: 0,
                    translateY: 0,
                    duration: 600,
                    easing: "easeOutElastic(1, .5)",
                });
            }
            setIsHovered(false);
        };

        btn.addEventListener("mousemove", handleMouseMove);
        btn.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            btn.removeEventListener("mousemove", handleMouseMove);
            btn.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    // Text Glitch Effect on Hover
    useEffect(() => {
        if (!textRef.current || !isHovered) return;

        const originalText = textRef.current.innerText;
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";

        // Create a glitch timeline using named export
        // Note: Casting to any to bypass restrictive TimelineParams type definition
        // while preserving runtime functionality (loop, duration, easing work in animejs)
        const timeline = new Timeline({
            loop: true,
            duration: 100,
            easing: "linear",
            direction: 'alternate',
        } as any);

        // Add keyframes for shake
        timeline.add(textRef.current, {
            translateX: [0, -2, 2, -2, 0],
            translateY: [0, 1, -1, 1, 0],
        });

        // Random character glitch
        const glitchInterval = setInterval(() => {
            if (!textRef.current) return;
            const glitchText = originalText
                .split("")
                .map((char) => {
                    if (Math.random() < 0.3) { // 30% chance to glitch a char
                        return chars[Math.floor(Math.random() * chars.length)];
                    }
                    return char;
                })
                .join("");

            textRef.current.innerText = glitchText;
        }, 50);

        return () => {
            clearInterval(glitchInterval);
            if (textRef.current) textRef.current.innerText = originalText;
            timeline.pause();
        };
    }, [isHovered]);

    return (
        <div className="relative p-8"> {/* Hit area buffer for magnetic feel */}
            <Link
                href={href}
                ref={buttonRef}
                onMouseEnter={() => setIsHovered(true)}
                className={cn(
                    "relative flex items-center justify-center overflow-hidden rounded-full px-10 py-4 font-mono font-bold tracking-widest uppercase transition-colors duration-300",
                    // White Brand Theme
                    "bg-transparent text-white border border-white", // Default: Transparent bg, White text, White border
                    "hover:bg-white hover:text-[#141414]", // Hover: White bg, Black text
                    "shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.6)]",
                    className
                )}
            >
                {/* Background Glitch Layers (pseudo-elements in CSS or extra divs) */}
                <div className={cn(
                    "absolute inset-0 bg-white mix-blend-difference opacity-0 transition-opacity duration-100",
                    isHovered && "animate-pulse opacity-20"
                )} />

                <span ref={textRef} className="relative z-10 block">
                    {children}
                </span>
            </Link>
        </div>
    );
}
