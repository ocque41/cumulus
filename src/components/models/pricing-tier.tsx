"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";
import { animate, stagger } from "animejs";

interface PricingTierProps {
    name: string;
    price: number | string;
    period: string;
    description: string;
    features: string[];
    tier: "free" | "pro" | "enterprise";
    badge?: string;
    cta: {
        text: string;
        href: string;
    };
    children?: ReactNode;
}

const tierConfig = {
    free: {
        icon: "◦",
        elevation: 4,
        glowOpacity: 0.05,
        floatIntensity: 2,
    },
    pro: {
        icon: "◦◦",
        elevation: 8,
        glowOpacity: 0.1,
        floatIntensity: 4,
    },
    enterprise: {
        icon: "◦◦◦",
        elevation: 12,
        glowOpacity: 0.15,
        floatIntensity: 6,
    },
};

export function PricingTier({
    name,
    price,
    period,
    description,
    features,
    tier,
    badge,
    cta,
}: PricingTierProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const priceRef = useRef<HTMLSpanElement>(null);
    const featuresRef = useRef<(HTMLDivElement | null)[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    const [displayPrice, setDisplayPrice] = useState(0);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const config = tierConfig[tier];

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

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!isVisible || !cardRef.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setDisplayPrice(typeof price === "number" ? price : 0);
            return;
        }

        // Card entry animation
        animate(cardRef.current, {
            opacity: [0, 1],
            translateY: [60, 0],
            duration: 800,
            easing: "easeOutExpo",
        });

        // Floating animation loop
        animate(cardRef.current, {
            translateY: [0, -config.floatIntensity, 0],
            duration: 3000,
            easing: "easeInOutSine",
            loop: true,
            delay: 800,
        });

        // Price counting animation
        if (typeof price === "number" && price > 0) {
            const obj = { value: 0 };
            animate(obj, {
                value: price,
                duration: 1500,
                delay: 400,
                easing: "easeOutExpo",
                onUpdate: () => setDisplayPrice(Math.round(obj.value)),
            });
        }

        // Features stagger animation
        const validFeatures = featuresRef.current.filter(Boolean);
        if (validFeatures.length > 0) {
            animate(validFeatures, {
                opacity: [0, 1],
                translateX: [-20, 0],
                duration: 500,
                delay: stagger(80, { start: 600 }),
                easing: "easeOutQuart",
            });
        }
    }, [isVisible, price, config.floatIntensity]);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePos({
            x: ((e.clientX - rect.left) / rect.width) * 100,
            y: ((e.clientY - rect.top) / rect.height) * 100,
        });
    };

    return (
        <div
            ref={cardRef}
            className="group relative rounded-[5.5px] border border-white/10 bg-[#141414] p-8 opacity-0"
            style={{
                boxShadow: `0 ${config.elevation}px ${config.elevation * 2}px rgba(0,0,0,0.4)`,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setMousePos({ x: 50, y: 50 })}
        >
            {/* Glow effect */}
            <div
                className="pointer-events-none absolute inset-0 rounded-[5.5px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                    background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,${config.glowOpacity}), transparent 50%)`,
                }}
            />

            {/* Badge */}
            {badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full border border-white/20 bg-[#141414] px-4 py-1 font-mono text-xs uppercase tracking-wider text-[color:var(--fg)]">
                        {badge}
                    </span>
                </div>
            )}

            {/* Tier indicator */}
            <div className="mb-6 flex items-center gap-3">
                <span className="font-mono text-2xl tracking-widest text-[color:var(--subtitle)]">
                    {config.icon}
                </span>
                <div className="h-px flex-1 bg-white/10" />
            </div>

            {/* Name */}
            <h3 className="font-mono text-2xl font-bold tracking-tight text-[color:var(--fg)]">
                {name}
            </h3>

            {/* Price */}
            <div className="mt-4">
                <span ref={priceRef} className="font-mono text-5xl font-bold text-[color:var(--fg)]">
                    {typeof price === "number" ? `$${displayPrice}` : price}
                </span>
                {period && (
                    <span className="ml-2 font-mono text-lg text-[color:var(--subtitle)]">
                        /{period}
                    </span>
                )}
            </div>

            {/* Description */}
            <p className="mt-2 font-mono text-sm text-[color:var(--subtitle)]">
                {description}
            </p>

            {/* Features */}
            <div className="mt-8 space-y-3">
                {features.map((feature, i) => (
                    <div
                        key={feature}
                        ref={(el) => {
                            featuresRef.current[i] = el;
                        }}
                        className="flex items-center gap-3 opacity-0"
                    >
                        <span className="text-[color:var(--subtitle)]">→</span>
                        <span className="font-mono text-sm text-[color:var(--fg)]">{feature}</span>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="mt-8">
                <a
                    href={cta.href}
                    className="block w-full rounded-lg border border-white/20 py-3 text-center font-mono text-sm font-semibold text-[color:var(--fg)] transition-all hover:bg-white/5"
                >
                    {cta.text}
                </a>
            </div>
        </div>
    );
}

