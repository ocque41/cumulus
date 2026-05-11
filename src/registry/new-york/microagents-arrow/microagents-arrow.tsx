"use client";

import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";

type MicroagentsArrowProps = {
  label?: string;
  direction?: "up" | "right" | "down" | "left";
  className?: string;
};

const rotationByDirection: Record<NonNullable<MicroagentsArrowProps["direction"]>, string> = {
  up: "-rotate-90",
  right: "rotate-0",
  down: "rotate-90",
  left: "rotate-180",
};

export function MicroagentsArrow({
  label = "Route microagent",
  direction = "right",
  className,
}: MicroagentsArrowProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-3 rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-[5.5px] bg-[color:var(--fg)]/10">
        <ArrowRight
          className={cn("h-4 w-4 text-[color:var(--fg)]", rotationByDirection[direction])}
          aria-hidden
        />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold leading-tight text-[color:var(--fg)]">{label}</p>
        <p className="text-xs text-[color:var(--muted)]">Directional control for linked agents</p>
      </div>
    </div>
  );
}
