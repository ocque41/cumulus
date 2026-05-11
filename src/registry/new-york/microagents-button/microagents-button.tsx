"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MicroagentsButtonProps = {
  label?: string;
  eyebrow?: string;
  className?: string;
  onClick?: () => void;
  href?: string;
};

export function MicroagentsButton({
  label = "Deploy microagent",
  eyebrow = "Orchestration",
  className,
  onClick,
  href,
}: MicroagentsButtonProps) {
  const content = (
    <>
      <div className="space-y-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[color:var(--muted)]">
          {eyebrow}
        </p>
        <p className="text-sm font-semibold text-[color:var(--fg)]">{label}</p>
      </div>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-[5.5px] bg-[color:var(--fg)]/10 text-[color:var(--fg)] transition duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[color:var(--fg)]/15">
        <ArrowUpRight className="h-4 w-4" aria-hidden />
      </span>
    </>
  );

  return (
    <Button
      type="button"
      variant="secondary"
      asChild={Boolean(href)}
      onClick={href ? undefined : onClick}
      className={cn(
        "group relative inline-flex h-auto items-center justify-between gap-4 rounded-[5.5px] border border-white/12",
        "bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.08),rgba(255,255,255,0)),#0f0f14] px-5 py-4 text-left",
        "shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur",
        "transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_70px_rgba(0,0,0,0.5)]",
        className
      )}
    >
      {href ? <Link href={href}>{content}</Link> : content}
    </Button>
  );
}
