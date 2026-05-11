"use client";

import { useRef, useEffect, useState } from "react";
import { animate } from "animejs";

interface MagneticLinkProps {
    children: React.ReactNode;
    href: string;
    className?: string;
    strength?: number;
}

export function MagneticLink({
    children,
    href,
    className = "",
    strength = 0.3,
}: MagneticLinkProps) {
    const linkRef = useRef<HTMLAnchorElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        const link = linkRef.current;
        if (!link) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!isHovered) return;

            const rect = link.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const deltaX = (e.clientX - centerX) * strength;
            const deltaY = (e.clientY - centerY) * strength;

            animate(link, {
                translateX: deltaX,
                translateY: deltaY,
                duration: 200,
                easing: "easeOutQuart",
            });
        };

        const handleMouseLeave = () => {
            animate(link, {
                translateX: 0,
                translateY: 0,
                duration: 400,
                easing: "easeOutElastic(1, .5)",
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        link.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            link.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, [isHovered, strength]);

    return (
        <a
            ref={linkRef}
            href={href}
            className={`inline-block ${className}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {children}
        </a>
    );
}
