"use client";

import { useRef, useEffect, useState } from "react";
import { animate } from "animejs";

interface SmokyCloudProps {
    className?: string;
}

export function SmokyCloud({ className }: SmokyCloudProps) {
    const cloudRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (cloudRef.current) {
            observer.observe(cloudRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || !cloudRef.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) return;

        // Keyframe animation for smoky cloud drift
        // Using tween values keyframes: arrays define the keyframe sequence
        animate(cloudRef.current, {
            translateX: ["0%", "3%", "-2%", "4%", "-1%", "0%"],
            translateY: ["0%", "-1.5%", "0.5%", "-2%", "1%", "0%"],
            scale: [1, 1.02, 0.98, 1.03, 0.99, 1],
            opacity: [0.4, 0.5, 0.35, 0.55, 0.45, 0.4],
            duration: 12000,
            loop: true,
            ease: "inOutSine",
        });
    }, [isVisible]);

    return (
        <div
            ref={cloudRef}
            className={`pointer-events-none absolute ${className}`}
            style={{
                opacity: 0.4,
            }}
        >
            {/* Cloud layers for smoky effect */}
            <div className="relative">
                {/* Main cloud body */}
                <div
                    className="absolute rounded-full blur-3xl"
                    style={{
                        width: "400px",
                        height: "200px",
                        background: "radial-gradient(ellipse, rgba(255,255,255,0.15) 0%, transparent 70%)",
                        left: "-50px",
                        top: "0",
                    }}
                />
                {/* Secondary puff */}
                <div
                    className="absolute rounded-full blur-2xl"
                    style={{
                        width: "250px",
                        height: "150px",
                        background: "radial-gradient(ellipse, rgba(255,255,255,0.12) 0%, transparent 70%)",
                        left: "150px",
                        top: "-30px",
                    }}
                />
                {/* Wispy tail */}
                <div
                    className="absolute rounded-full blur-xl"
                    style={{
                        width: "180px",
                        height: "80px",
                        background: "radial-gradient(ellipse, rgba(255,255,255,0.08) 0%, transparent 70%)",
                        left: "300px",
                        top: "40px",
                    }}
                />
                {/* Dense center */}
                <div
                    className="absolute rounded-full blur-2xl"
                    style={{
                        width: "150px",
                        height: "120px",
                        background: "radial-gradient(ellipse, rgba(255,255,255,0.2) 0%, transparent 60%)",
                        left: "80px",
                        top: "20px",
                    }}
                />
            </div>
        </div>
    );
}
