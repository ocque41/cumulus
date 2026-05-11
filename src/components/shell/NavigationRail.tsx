"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "DOME", href: "/", external: false },
  { label: "SETTINGS", href: "/settings", external: false },
];

export function NavigationRail() {
  const pathname = usePathname();

  return (
    <nav className="glass-surface glass-subtle glass-e3 fixed left-4 top-4 bottom-4 z-40 hidden w-24 rounded-[5.5px] border border-[color:var(--glass-border-base)] p-3 lg:flex lg:flex-col lg:items-center">
      <div className="mb-8 text-[10px] font-semibold uppercase tracking-[0.26em] text-[color:var(--glass-text-muted)] [writing-mode:vertical-rl]">
        Tado
      </div>

      <div className="flex w-full flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const active = !item.external && pathname === item.href;
          const className = cn(
            "glass-surface glass-standard glass-e1 flex aspect-square w-full items-center justify-center rounded-[5.5px] text-[11px] font-semibold tracking-[0.08em] transition-colors",
            active
              ? "border-[color:var(--glass-text-body)] text-[color:var(--glass-text-title)]"
              : "text-[color:var(--glass-text-muted)] hover:text-[color:var(--glass-text-body)]"
          );

          if (item.external) {
            return (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" className={className}>
                {item.label}
              </a>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
