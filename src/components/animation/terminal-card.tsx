"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface TerminalCardProps {
    title: string;
    command: string;
    children: ReactNode;
    className?: string;
    typingSpeed?: number;
    delay?: number;
}

export function TerminalCard({
    title,
    command,
    children,
    className,
    typingSpeed = 40,
    delay = 0,
}: TerminalCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [typedCommand, setTypedCommand] = useState("");
    const [showContent, setShowContent] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined" || !ref.current) return;

        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

        if (prefersReducedMotion) {
            setTypedCommand(command);
            setShowContent(true);
            return;
        }

        const runAnimation = () => {
            if (hasAnimated.current) return;
            hasAnimated.current = true;

            let index = 0;
            const typeInterval = setInterval(() => {
                if (index <= command.length) {
                    setTypedCommand(command.slice(0, index));
                    index++;
                } else {
                    clearInterval(typeInterval);
                    setTimeout(() => setShowContent(true), 200);
                }
            }, typingSpeed);

            return () => clearInterval(typeInterval);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(runAnimation, delay);
                    observer.disconnect();
                }
            },
            { threshold: 0.3 }
        );

        observer.observe(ref.current);
        return () => observer.disconnect();
    }, [command, typingSpeed, delay]);

    // Cursor blink
    useEffect(() => {
        const interval = setInterval(() => {
            setCursorVisible((v) => !v);
        }, 530);
        return () => clearInterval(interval);
    }, []);

    return (
        <div
            ref={ref}
            className={`
        rounded-lg border border-[color:var(--muted)]/20 bg-[color:var(--bg)]
        font-mono text-sm overflow-hidden
        ${className}
      `}
        >
            {/* Terminal header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[color:var(--muted)]/10 bg-[color:var(--muted)]/5">
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="ml-2 text-xs text-[color:var(--muted)] uppercase tracking-wider">
                    {title}
                </span>
            </div>

            {/* Terminal content */}
            <div className="p-4 space-y-3">
                {/* Command line */}
                <div className="flex items-center gap-2 text-[color:var(--muted)]">
                    <span className="text-green-500">$</span>
                    <span>{typedCommand}</span>
                    <span
                        className={`w-2 h-4 bg-[color:var(--text)] ${cursorVisible ? "opacity-100" : "opacity-0"
                            }`}
                    />
                </div>

                {/* Output */}
                <div
                    className={`
            space-y-2 text-[color:var(--text)]
            transition-all duration-300
            ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}
          `}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

interface TerminalLineProps {
    prefix?: string;
    children: ReactNode;
    className?: string;
    success?: boolean;
}

export function TerminalLine({
    prefix = ">",
    children,
    className,
    success,
}: TerminalLineProps) {
    return (
        <div className={`flex items-start gap-2 ${className}`}>
            <span className={success ? "text-green-500" : "text-[color:var(--muted)]"}>
                {success ? "✓" : prefix}
            </span>
            <span>{children}</span>
        </div>
    );
}
