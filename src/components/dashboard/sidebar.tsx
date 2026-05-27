"use client";

import React, { useEffect, useRef } from "react";
import { animate, stagger } from "animejs";
import {
    LayoutDashboard,
    Settings,
    type LucideIcon
} from "lucide-react";
import { useCrossDomainTransition } from "@/hooks/useCrossDomainTransition";

const links: { href: string; label: string; icon: LucideIcon; indent?: boolean }[] = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/system", label: "System", icon: Settings },
];

interface DashboardSidebarProps {
    animateEntrance?: boolean;
    onLinkClick?: () => void;
}

export function DashboardSidebar({ animateEntrance = false, onLinkClick }: DashboardSidebarProps) {
    const { navigateTo } = useCrossDomainTransition();
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        if (animateEntrance && listRef.current) {
            animate(
                listRef.current.querySelectorAll('.sidebar-item'),
                {
                    opacity: [0, 1],
                    translateX: [-20, 0],
                    delay: stagger(50),
                    easing: 'easeOutQuad',
                    duration: 400
                }
            );
        }
    }, [animateEntrance]);

    const handleClick = (e: React.MouseEvent, link: typeof links[0]) => {
        e.preventDefault();
        if (onLinkClick) onLinkClick();
        navigateTo(link.href);
    };

    return (
        <div className="flex flex-col gap-6">

            <nav aria-label="Dashboard">
                <ul ref={listRef} className="flex flex-col gap-2">
                    {links.map((link) => (
                        <li key={link.href} className={`sidebar-item ${link.indent ? "pl-4 border-l border-zinc-800" : ""} ${animateEntrance ? "opacity-0" : ""}`}>
                            <button
                                onClick={(e) => handleClick(e, link)}
                                className="group flex items-center gap-3 w-full p-2 rounded-md text-sm text-left tracking-[-0.03em] text-[color:var(--muted)] transition-colors duration-200 hover:text-[color:var(--neon-green)] focus-visible:outline-none"
                            >
                                <link.icon className="size-4 shrink-0 transition-colors group-hover:text-[color:var(--neon-green)]" />
                                <span>{link.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
