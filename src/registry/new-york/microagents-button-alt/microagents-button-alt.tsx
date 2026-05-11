"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MicroagentsButtonAltProps = {
  label?: string;
  helperText?: string;
  className?: string;
  onClick?: () => void;
};

export function MicroagentsButtonAlt({
  label = "Launch playbook",
  helperText = "Runs against production safely",
  className,
  onClick,
}: MicroagentsButtonAltProps) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      className={cn(
        "flex h-auto items-center justify-between gap-4 rounded-[5.5px] border-[color:var(--muted)]/40 bg-[rgba(255,255,255,0.02)] px-5 py-4 text-left shadow-[0_16px_32px_rgba(0,0,0,0.22)]",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-semibold text-[color:var(--fg)]">{label}</p>
        <p className="text-xs text-[color:var(--muted)]">{helperText}</p>
      </div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[5.5px] bg-[color:var(--muted)]/10 text-[color:var(--fg)]">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>
    </Button>
  );
}
