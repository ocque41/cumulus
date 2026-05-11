"use client";

import { cn } from "@/lib/utils";

type MicroagentsCircleProps = {
  label?: string;
  status?: "active" | "idle" | "error";
  helperText?: string;
  className?: string;
};

const circlePalette: Record<NonNullable<MicroagentsCircleProps["status"]>, string> = {
  active: "from-[#71f5d5] via-[#7c8bfd] to-[#1f1f2a]",
  idle: "from-[#2a2a2f] via-[#1b1b1f] to-[#0d0d12]",
  error: "from-[#f97316] via-[#f472b6] to-[#1b0f1c]",
};

export function MicroagentsCircle({
  label = "Microagent",
  status = "active",
  helperText = "Online and accepting prompts",
  className,
}: MicroagentsCircleProps) {
  const gradient = circlePalette[status];

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[rgba(255,255,255,0.02)] px-4 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      <div
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br",
          gradient,
          status === "active" && "shadow-[0_0_0_6px_rgba(113,245,213,0.08)]"
        )}
        aria-hidden
      >
        <span className="h-[10px] w-[10px] rounded-full bg-black/70 shadow-[0_0_0_6px_rgba(0,0,0,0.45)]" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[color:var(--fg)]">{label}</p>
        <p className="text-xs text-[color:var(--muted)]">{helperText}</p>
      </div>
    </div>
  );
}
