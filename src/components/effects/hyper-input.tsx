"use client";

import { useRef, useState, useEffect, type InputHTMLAttributes } from "react";
import { animate } from "animejs";

import { cn } from "@/lib/utils";

interface HyperInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    /** Label text */
    label: string;
    /** Controlled value */
    value: string;
    /** Value change handler */
    onChange: (value: string) => void;
    /** Callback when focus state changes (for warp speed control) */
    onFocusChange?: (focused: boolean) => void;
    /** Enable text scramble animation on focus */
    scrambleOnFocus?: boolean;
}

// Characters used for scramble effect
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

/**
 * Scrambles text character by character then reveals the original.
 */
function scrambleText(
    element: HTMLElement,
    originalText: string,
    duration = 600
): void {
    const chars = originalText.split("");
    const iterations = Math.ceil(duration / 50);
    let currentIteration = 0;

    const interval = setInterval(() => {
        const progress = currentIteration / iterations;

        const newText = chars.map((char, i) => {
            if (char === " ") return " ";

            // Progressively reveal characters
            if (i < originalText.length * progress) {
                return originalText[i];
            }

            // Random character
            return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        }).join("");

        element.textContent = newText;
        currentIteration++;

        if (currentIteration >= iterations) {
            clearInterval(interval);
            element.textContent = originalText;
        }
    }, 50);
}

/**
 * Hyper-interactive form input with scramble labels and glow effects.
 * 
 * Features:
 * - Text scramble animation on focus
 * - Glowing border on focus
 * - Callback for warp speed control
 */
export function HyperInput({
    label,
    value,
    onChange,
    onFocusChange,
    scrambleOnFocus = true,
    className,
    type = "text",
    ...props
}: HyperInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const labelRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        onFocusChange?.(true);

        // Scramble label text
        if (scrambleOnFocus && labelRef.current) {
            scrambleText(labelRef.current, label.toUpperCase());
        }

        // Glow animation
        if (containerRef.current) {
            animate(containerRef.current, {
                borderColor: "#00F3FF",
                boxShadow: "0 0 20px rgba(0, 243, 255, 0.3)",
                duration: 300,
                easing: "easeOutQuart",
            });
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        onFocusChange?.(false);

        // Remove glow
        if (containerRef.current) {
            animate(containerRef.current, {
                borderColor: "rgba(255, 255, 255, 0.1)",
                boxShadow: "0 0 0 rgba(0, 243, 255, 0)",
                duration: 400,
                easing: "easeOutQuart",
            });
        }
    };

    return (
        <div className={cn("relative", className)}>
            {/* Label */}
            <label
                className={cn(
                    "block font-mono text-[10px] uppercase tracking-[0.2em] mb-2",
                    "transition-colors duration-200",
                    isFocused ? "text-[#F0EEE9]" : "text-[#F0EEE9]/60"
                )}
            >
                <span ref={labelRef}>{label.toUpperCase()}</span>
            </label>

            {/* Input container */}
            <div
                ref={containerRef}
                className={cn(
                    "relative rounded-lg overflow-hidden",
                    "border border-[#222222]",
                    "bg-[#141414]", // Increased opacity (solid color)
                    "transition-all duration-200"
                )}
            >
                <input
                    ref={inputRef}
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    className={cn(
                        "w-full px-4 py-3",
                        "bg-transparent",
                        "font-mono text-sm text-[#F0EEE9]",
                        "placeholder-[#333333]",
                        "outline-none",
                        "appearance-none"
                    )}
                    {...props}
                />

                {/* Active indicator */}
                <div
                    className={cn(
                        "absolute bottom-0 left-0 h-[2px]",
                        "bg-[#F0EEE9]",
                        "transition-all duration-300",
                        isFocused ? "w-full" : "w-0"
                    )}
                />
            </div>
        </div>
    );
}

interface HyperTextareaProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onFocusChange?: (focused: boolean) => void;
    scrambleOnFocus?: boolean;
    rows?: number;
    placeholder?: string;
    className?: string;
}

/**
 * Hyper-interactive textarea with the same effects as HyperInput.
 */
export function HyperTextarea({
    label,
    value,
    onChange,
    onFocusChange,
    scrambleOnFocus = true,
    rows = 4,
    placeholder,
    className,
}: HyperTextareaProps) {
    const labelRef = useRef<HTMLSpanElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = () => {
        setIsFocused(true);
        onFocusChange?.(true);

        if (scrambleOnFocus && labelRef.current) {
            scrambleText(labelRef.current, label.toUpperCase());
        }

        if (containerRef.current) {
            animate(containerRef.current, {
                borderColor: "#F0EEE9",
                boxShadow: "0 0 20px rgba(240, 238, 233, 0.1)",
                duration: 300,
                easing: "easeOutQuart",
            });
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        onFocusChange?.(false);

        if (containerRef.current) {
            animate(containerRef.current, {
                borderColor: "#222222",
                boxShadow: "0 0 0 rgba(0, 0, 0, 0)",
                duration: 400,
                easing: "easeOutQuart",
            });
        }
    };

    return (
        <div className={cn("relative", className)}>
            <label
                className={cn(
                    "block font-mono text-[10px] uppercase tracking-[0.2em] mb-2",
                    "transition-colors duration-200",
                    isFocused ? "text-[#F0EEE9]" : "text-[#F0EEE9]/60"
                )}
            >
                <span ref={labelRef}>{label.toUpperCase()}</span>
            </label>

            <div
                ref={containerRef}
                className={cn(
                    "relative rounded-lg overflow-hidden",
                    "border border-[#222222]",
                    "bg-[#141414]",
                    "transition-all duration-200"
                )}
            >
                <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    rows={rows}
                    placeholder={placeholder}
                    className={cn(
                        "w-full px-4 py-3",
                        "bg-transparent",
                        "font-mono text-sm text-[#F0EEE9]",
                        "placeholder-[#333333]",
                        "outline-none resize-none"
                    )}
                />

                <div
                    className={cn(
                        "absolute bottom-0 left-0 h-[2px]",
                        "bg-[#F0EEE9]",
                        "transition-all duration-300",
                        isFocused ? "w-full" : "w-0"
                    )}
                />
            </div>
        </div>
    );
}

interface LaunchButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
}

/**
 * Launch button with morphing animation for form submission.
 */
export function LaunchButton({
    children,
    onClick,
    disabled,
    loading,
    className,
}: LaunchButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isLaunching, setIsLaunching] = useState(false);

    const handleClick = () => {
        if (disabled || loading || isLaunching) return;

        setIsLaunching(true);

        // Animate button
        if (buttonRef.current) {
            animate(buttonRef.current, {
                scale: [1, 0.95, 1.05, 1],
                duration: 400,
                easing: "easeInOutQuart",
                complete: () => {
                    onClick?.();
                    setTimeout(() => setIsLaunching(false), 200);
                },
            });
        }
    };

    return (
        <button
            ref={buttonRef}
            onClick={handleClick}
            disabled={disabled || loading}
            className={cn(
                "relative px-8 py-4 rounded-full",
                "font-mono text-sm uppercase tracking-widest",
                "transition-all duration-300",
                "outline-none",
                // Default state
                "bg-[#00F3FF] text-black",
                "hover:shadow-[0_0_30px_rgba(0,243,255,0.5)]",
                // Disabled state
                disabled && "opacity-50 cursor-not-allowed",
                // Loading state
                loading && "animate-pulse",
                className
            )}
        >
            <span className={cn(
                "relative z-10",
                (loading || isLaunching) && "opacity-0"
            )}>
                {children}
            </span>

            {/* Loading indicator */}
            {(loading || isLaunching) && (
                <span className="absolute inset-0 flex items-center justify-center">
                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                </span>
            )}
        </button>
    );
}
