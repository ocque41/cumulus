"use client";

import { ArrowRightLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MicroagentsLinkProps = {
  label?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
};

export function MicroagentsLink({
  label = "Agent link",
  description = "Trigger the linked microagent flow",
  className,
  onClick,
}: MicroagentsLinkProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[rgba(255,255,255,0.02)] px-4 py-3",
        className
      )}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-[color:var(--fg)]">{label}</p>
        <p className="text-xs text-[color:var(--muted)]">{description}</p>
      </div>
      <Button
        type="button"
        size="icon"
        variant="secondary"
        className="h-10 w-10 rounded-[5.5px]"
        onClick={onClick}
        aria-label={`Open ${label}`}
      >
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
    </div>
  );
}
