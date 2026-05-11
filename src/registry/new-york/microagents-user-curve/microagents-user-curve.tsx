"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type MicroagentsCurveProps = {
  className?: string;
};

export function MicroagentsUserCurve({ className }: MicroagentsCurveProps) {
  const gradientId = React.useId();

  return (
    <svg
      viewBox="0 0 360 160"
      role="img"
      aria-label="User interaction curve"
      className={cn("h-auto w-full max-w-lg text-[color:var(--fg)]/80", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f472b6" stopOpacity="0.65" />
          <stop offset="45%" stopColor="#f97316" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#facc15" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        d="M12 24c64 52 130 92 168 92s104-40 168-92"
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        strokeLinecap="round"
        className="drop-shadow-[0_12px_30px_rgba(249,115,22,0.22)]"
      />
      <circle cx="12" cy="24" r="7" fill="#f472b6" />
      <circle cx="348" cy="24" r="7" fill="#facc15" />
    </svg>
  );
}
