"use client";

import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MicroagentsOrchestrationLeftProps = {
  label?: string;
  className?: string;
  onClick?: () => void;
};

export function MicroagentsOrchestrationLeft({
  label = "Orchestrate left",
  className,
  onClick,
}: MicroagentsOrchestrationLeftProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "h-10 w-10 rounded-[5.5px] border border-[color:var(--muted)]/40 bg-[rgba(255,255,255,0.03)]",
        className
      )}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
  );
}
