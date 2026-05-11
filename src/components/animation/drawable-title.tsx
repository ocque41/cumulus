"use client";

import { useRef, useEffect, useState } from "react";
import { animate, svg } from "animejs";

interface DrawableTitleProps {
    text: string;
    className?: string;
}

export function DrawableTitle({ text, className }: DrawableTitleProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isDrawn, setIsDrawn] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.5 }
        );

        if (svgRef.current) {
            observer.observe(svgRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || !svgRef.current || isDrawn) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setIsDrawn(true);
            return;
        }

        // Get all path elements
        const paths = svgRef.current.querySelectorAll("path");
        if (paths.length === 0) return;

        // Create drawable elements
        const drawables = svg.createDrawable(paths);

        // Animate the stroke drawing
        animate(drawables, {
            draw: ["0 0", "0 1"],
            duration: 2500,
            delay: (_, i) => i * 100,
            ease: "easeOutExpo",
            onComplete: () => setIsDrawn(true),
        });
    }, [isVisible, isDrawn]);

    // Generate SVG path data for text (simplified representation)
    // Using a stylized monospace approach
    const generateTextPath = (char: string, index: number): string => {
        const x = index * 48;
        const paths: { [key: string]: string } = {
            E: `M${x + 5},5 L${x + 5},45 M${x + 5},5 L${x + 35},5 M${x + 5},25 L${x + 30},25 M${x + 5},45 L${x + 35},45`,
            N: `M${x + 5},45 L${x + 5},5 L${x + 35},45 L${x + 35},5`,
            T: `M${x + 5},5 L${x + 35},5 M${x + 20},5 L${x + 20},45`,
            R: `M${x + 5},45 L${x + 5},5 L${x + 30},5 Q${x + 40},5 ${x + 40},15 Q${x + 40},25 ${x + 30},25 L${x + 5},25 L${x + 35},45`,
            P: `M${x + 5},45 L${x + 5},5 L${x + 30},5 Q${x + 40},5 ${x + 40},15 Q${x + 40},25 ${x + 30},25 L${x + 5},25`,
            I: `M${x + 10},5 L${x + 30},5 M${x + 20},5 L${x + 20},45 M${x + 10},45 L${x + 30},45`,
            S: `M${x + 35},10 Q${x + 35},5 ${x + 20},5 Q${x + 5},5 ${x + 5},15 Q${x + 5},25 ${x + 20},25 Q${x + 35},25 ${x + 35},35 Q${x + 35},45 ${x + 20},45 Q${x + 5},45 ${x + 5},40`,
        };
        return paths[char] || "";
    };

    return (
        <svg
            ref={svgRef}
            className={className}
            viewBox={`0 0 ${text.length * 48} 50`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {text.split("").map((char, i) => (
                <path
                    key={i}
                    d={generateTextPath(char.toUpperCase(), i)}
                    style={{
                        strokeDasharray: isDrawn ? "none" : undefined,
                    }}
                />
            ))}
        </svg>
    );
}
