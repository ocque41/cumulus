import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useTilt } from "@/hooks";

interface GlassPanelProps {
    children: ReactNode;
    className?: string;
    /** Enable noise texture overlay */
    noise?: boolean;
    /** Panel padding preset */
    padding?: "none" | "sm" | "md" | "lg";
    /** Border radius preset */
    radius?: "sm" | "md" | "lg" | "xl";
    /** Enable 3D tilt effect on hover */
    tilt?: boolean;
}

const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
};

const radiusClasses = {
    sm: "rounded-lg",
    md: "rounded-[5.5px]",
    lg: "rounded-[5.5px]",
    xl: "rounded-[5.5px]",
};

/**
 * GlassPanel - Frosted glass container component.
 * 
 * Provides visual contrast against busy 3D backgrounds with:
 * - Backdrop blur for depth
 * - Gradient border for edge definition
 * - Optional noise texture for analog feel
 * - Optional 3D tilt interaction
 */
export function GlassPanel({
    children,
    className,
    noise = true,
    padding = "md",
    radius = "lg",
    tilt = false,
}: GlassPanelProps) {
    const ref = useRef<HTMLDivElement>(null);
    useTilt(ref, { disabled: !tilt });

    return (
        <div
            ref={ref}
            className={cn(
                "relative overflow-hidden group",
                // Glass effect
                "bg-gradient-to-br from-white/10 to-white/5",
                "backdrop-blur-xl",
                "border border-white/10",
                // Shadow for depth
                "shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]",
                // Sizing
                paddingClasses[padding],
                radiusClasses[radius],
                className
            )}
            style={{
                // Fix for safari overflow hidden with border radius
                transform: 'translateZ(0)'
            }}
        >
            {/* Animated Gradient Border (on hover) */}
            <div
                className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none",
                    "bg-gradient-to-br from-white/20 via-transparent to-transparent",
                    radiusClasses[radius]
                )}
                aria-hidden
            />

            {/* Noise texture overlay */}
            {noise && (
                <div
                    className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                        backgroundSize: "200px 200px",
                    }}
                    aria-hidden
                />
            )}

            {/* Inner glow */}
            <div
                className="absolute inset-0 opacity-50 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 50%)",
                }}
                aria-hidden
            />

            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}
