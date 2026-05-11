"use client";

import { cn } from "@/lib/utils";

interface PricingCardProps {
    title: string;
    price: string | number;
    interval: string;
    features: string[];
    description?: string;
    ctaText: string;
    ctaHref: string;
    featured?: boolean;
    badgeText?: string;
    className?: string;
}

export function PricingCard({
    title,
    price,
    interval,
    features,
    description,
    ctaText,
    ctaHref,
    featured = false,
    badgeText,
    className,
}: PricingCardProps) {
    return (
        <div
            className={cn(
                "relative flex-shrink-0 p-8 transition-all duration-300",
                featured ? "glass-card-highlight w-[400px]" : "glass-card w-[400px]",
                className
            )}
            style={{ scrollSnapAlign: "center" }}
        >
            {featured && badgeText && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="glass-badge px-4 py-1 font-mono text-xs uppercase tracking-wider text-[color:var(--fg)]">
                        {badgeText}
                    </span>
                </div>
            )}

            <div className="mb-6 flex items-center gap-3">
                <span className="font-mono text-xl tracking-widest text-[color:var(--subtitle)]">
                    {featured ? "◦◦" : "◦"}
                </span>
                <div className="h-px flex-1 bg-white/10" />
                <span className={cn(
                    "font-mono text-xs uppercase tracking-wider",
                    featured ? "text-[color:var(--fg)]" : "text-[color:var(--subtitle)]"
                )}>
                    {title}
                </span>
            </div>

            <div className="text-center">
                <span className="font-mono text-5xl font-bold text-[color:var(--fg)]">
                    ${price}
                </span>
                <span className="ml-2 font-mono text-lg text-[color:var(--subtitle)]">/{interval}</span>
            </div>

            {description && (
                <p className="mt-2 text-center font-mono text-sm text-[color:var(--subtitle)]">
                    {description}
                </p>
            )}

            <div className="mt-8 space-y-3">
                {features.map((f) => (
                    <div key={f} className="flex items-center gap-3">
                        <span className="text-[color:var(--subtitle)]">→</span>
                        <span className="font-mono text-sm text-[color:var(--fg)]">{f}</span>
                    </div>
                ))}
            </div>

            <a
                href={ctaHref}
                className={cn(
                    "mt-8 block w-full py-3 text-center font-mono text-sm font-semibold transition-transform active:scale-95",
                    featured ? "glass-button-primary" : "glass-button text-[color:var(--fg)]"
                )}
            >
                {ctaText}
            </a>
        </div>
    );
}
