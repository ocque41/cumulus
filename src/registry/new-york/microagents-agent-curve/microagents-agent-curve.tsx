"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type MicroagentsCurveProps = {
  className?: string;
};

export function MicroagentsAgentCurve({ className }: MicroagentsCurveProps) {
  const gradientId = React.useId();

  return (
    <svg
      viewBox="0 0 360 160"
      role="img"
      aria-label="Agent orchestration curve"
      className={cn("h-auto w-full max-w-lg text-[color:var(--fg)]/80", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#71f5d5" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#7c8bfd" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#9ce3ff" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      <path
        d="M12 132C76 84 142 44 180 44c38 0 104 40 168 88"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        className="drop-shadow-[0_12px_30px_rgba(124,139,253,0.28)]"
      />
      <circle cx="12" cy="132" r="7" fill="#71f5d5" />
      <circle cx="348" cy="132" r="7" fill="#7c8bfd" />
    </svg>
  );
}
