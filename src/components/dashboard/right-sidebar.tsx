"use client";

import { cn } from "@/lib/utils";

type Tab = {
    id: string;
    label: string;
};

const tabs: Tab[] = [
    { id: "growth", label: "Growth & Volume" },
    { id: "trends", label: "Trends & Projections" },
    { id: "composition", label: "Composition Analysis" },
];

interface RightSidebarProps {
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
}

export function RightSidebar({ activeTab, onTabChange, className }: RightSidebarProps) {
    return (
        <div className={cn("hidden w-64 lg:flex flex-col gap-6", className)}>
            <nav aria-label="Analytics Sections">
                <ul className="flex flex-col gap-4">
                    {tabs.map((tab) => (
                        <li key={tab.id}>
                            <button
                                onClick={() => onTabChange(tab.id)}
                                className={cn(
                                    "text-sm text-left tracking-[-0.03em] transition-colors duration-200 focus-visible:outline-none w-full",
                                    activeTab === tab.id
                                        ? "text-[color:var(--neon-green)] font-medium"
                                        : "text-[color:var(--muted)] hover:text-[color:var(--neon-green)]"
                                )}
                            >
                                {tab.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    );
}
