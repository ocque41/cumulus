import * as React from "react";

import { cn } from "@/lib/utils";

import { GlassSurface } from "./glass-surface";

export const GlassCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <GlassSurface
      ref={ref}
      material="standard"
      elevation="e2"
      interactive
      className={cn("p-6", className)}
      {...props}
    />
  )
);

GlassCard.displayName = "GlassCard";
