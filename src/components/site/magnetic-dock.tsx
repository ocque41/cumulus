"use client";

import { useRef, type ReactNode, type MouseEvent } from "react";
import { animate, createSpring } from "animejs";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
    children: ReactNode;
    className?: string;
    /** Magnetic attraction strength (0-1) */
    intensity?: number;
    /** As React component - renders as button, link, etc */
    asChild?: boolean;
    href?: string;
    onClick?: () => void;
}

/**
 * Magnetic Button with Anime.js v4 spring physics.
 * 
 * The button pulls towards the cursor on hover and springs back
 * when the mouse leaves, creating a tactile "antigravity" feel.
 */
export function MagneticButton({
    children,
    className,
    intensity = 0.4,
    asChild,
    href,
    onClick,
}: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement & HTMLAnchorElement>(null);
    const innerRef = useRef<HTMLSpanElement>(null);

    const handleMouseMove = (e: MouseEvent) => {
        if (!ref.current) return;

        const rect = ref.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) * intensity;
        const y = (e.clientY - rect.top - rect.height / 2) * intensity;

        // Animate button position towards cursor
        animate(ref.current, {
            x: x,
            y: y,
            duration: 100,
            easing: "linear",
        });

        // Animate inner content with parallax offset
        if (innerRef.current) {
            animate(innerRef.current, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 150,
                easing: "linear",
            });
        }
    };

    const handleMouseLeave = () => {
        if (!ref.current) return;

        // Spring back to original position
        animate(ref.current, {
            x: 0,
            y: 0,
            ease: createSpring({ stiffness: 300, damping: 15 }),
        });

        if (innerRef.current) {
            animate(innerRef.current, {
                x: 0,
                y: 0,
                ease: createSpring({ stiffness: 400, damping: 20 }),
            });
        }
    };

    const commonProps = {
        ref,
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
        onClick,
        className: cn(
            "relative inline-flex items-center justify-center",
            "will-change-transform",
            className
        ),
        style: { transform: "translateZ(0)" },
    };

    const content = (
        <span ref={innerRef} className="relative z-10">
            {children}
        </span>
    );

    if (href) {
        return (
            <a {...commonProps} href={href}>
                {content}
            </a>
        );
    }

    return (
        <button {...commonProps} type="button">
            {content}
        </button>
    );
}

interface MagneticDockProps {
    children: ReactNode;
    className?: string;
}

/**
 * Glassmorphism dock container for magnetic navigation items.
 * 
 * Provides the frosted glass backdrop and contains MagneticButton items.
 */
export function MagneticDock({ children, className }: MagneticDockProps) {
    return (
        <nav
            className={cn(
                // Position
                "fixed bottom-8 left-1/2 -translate-x-1/2 z-50",
                // Glass effect
                "backdrop-blur-xl bg-white/5",
                "border border-white/10 rounded-[5.5px]",
                // Shadow for depth
                "shadow-[0_0_40px_rgba(0,0,0,0.3)]",
                // Padding
                "px-6 py-3",
                // Flex
                "flex items-center gap-2",
                className
            )}
        >
            {children}
        </nav>
    );
}

/**
 * Individual dock item with magnetic effect.
 */
export function MagneticDockItem({
    children,
    href,
    active,
    className,
}: {
    children: ReactNode;
    href: string;
    active?: boolean;
    className?: string;
}) {
    return (
        <MagneticButton
            href={href}
            intensity={0.35}
            className={cn(
                // Base styles
                "px-4 py-2 rounded-[5.5px]",
                "text-sm font-mono uppercase tracking-widest",
                "transition-colors duration-200",
                // Default state
                "text-white/60 hover:text-white",
                // Active state
                active && "text-white bg-white/10",
                className
            )}
        >
            {children}
        </MagneticButton>
    );
}
