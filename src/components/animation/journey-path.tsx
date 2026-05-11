"use client";

import { useRef, useEffect, useState } from "react";
import { animate, svg } from "animejs";

interface JourneyStep {
    icon: string;
    title: string;
    description: string;
}

interface JourneyPathProps {
    steps: JourneyStep[];
    className?: string;
}

export function JourneyPath({ steps, className }: JourneyPathProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement>(null);
    const dotRef = useRef<HTMLDivElement>(null);
    const stepsRef = useRef<(HTMLDivElement | null)[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [activeStep, setActiveStep] = useState(-1);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || !pathRef.current || !dotRef.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setActiveStep(steps.length - 1);
            return;
        }

        // Create drawable for path
        const [drawable] = svg.createDrawable(pathRef.current);

        // Draw the path
        animate(drawable, {
            draw: ["0 0", "0 1"],
            duration: 3000,
            ease: "easeInOutQuart",
        });

        // Create motion path for the dot
        const motionPath = svg.createMotionPath(pathRef.current);

        // Animate dot along path
        animate(dotRef.current, {
            ...motionPath,
            duration: 3000,
            ease: "easeInOutQuart",
            onUpdate: (anim) => {
                const progress = anim.progress / 100;
                const stepIndex = Math.min(
                    Math.floor(progress * steps.length),
                    steps.length - 1
                );
                if (stepIndex !== activeStep) {
                    setActiveStep(stepIndex);
                }
            },
        });

        // Stagger step reveals
        const validSteps = stepsRef.current.filter(Boolean);
        if (validSteps.length > 0) {
            animate(validSteps, {
                opacity: [0, 1],
                translateY: [20, 0],
                duration: 500,
                delay: (_, i) => 800 + i * 400,
                ease: "easeOutQuart",
            });
        }
    }, [isVisible, steps.length, activeStep]);

    // Generate curved path through step positions
    const generatePath = () => {
        const stepCount = steps.length;
        const width = 100;
        const height = stepCount * 120;

        let d = `M 50 20`;

        for (let i = 1; i < stepCount; i++) {
            const y = 20 + i * 120;
            const prevY = 20 + (i - 1) * 120;
            const midY = (y + prevY) / 2;
            const curveX = i % 2 === 0 ? 80 : 20;

            d += ` Q ${curveX} ${midY} 50 ${y}`;
        }

        return d;
    };

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* SVG Path */}
            <svg
                className="absolute left-1/2 top-0 h-full w-24 -translate-x-1/2"
                viewBox={`0 0 100 ${steps.length * 120}`}
                fill="none"
                preserveAspectRatio="none"
            >
                <path
                    ref={pathRef}
                    d={generatePath()}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                />
            </svg>

            {/* Animated dot */}
            <div
                ref={dotRef}
                className="absolute left-1/2 top-5 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_20px_rgba(255,255,255,0.5)]"
                style={{ opacity: isVisible ? 1 : 0 }}
            />

            {/* Steps */}
            <div className="relative space-y-12">
                {steps.map((step, i) => (
                    <div
                        key={step.title}
                        ref={(el) => { stepsRef.current[i] = el; }}
                        className={`flex items-center gap-8 opacity-0 transition-all duration-500 ${i % 2 === 0 ? "flex-row" : "flex-row-reverse"
                            } ${activeStep >= i ? "scale-100" : "scale-95"}`}
                        style={{
                            paddingLeft: i % 2 === 0 ? "0" : "calc(50% + 2rem)",
                            paddingRight: i % 2 === 0 ? "calc(50% + 2rem)" : "0",
                        }}
                    >
                        <div
                            className={`glass-card flex-1 p-6 transition-all duration-300 ${activeStep >= i ? "border-white/20" : "border-white/5"
                                }`}
                        >
                            <div className="mb-3 flex items-center gap-3">
                                <span
                                    className={`font-mono text-2xl transition-all duration-300 ${activeStep >= i ? "text-[color:var(--fg)]" : "text-[color:var(--subtitle)]"
                                        }`}
                                >
                                    {step.icon}
                                </span>
                                <h4 className="font-mono text-sm font-semibold text-[color:var(--fg)]">
                                    {step.title}
                                </h4>
                            </div>
                            <p className="font-mono text-xs leading-relaxed text-[color:var(--subtitle)]">
                                {step.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
