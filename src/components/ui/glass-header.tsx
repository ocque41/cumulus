import * as React from "react";

import { cn } from "@/lib/utils";

import { GlassSurface } from "./glass-surface";

export function GlassHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <GlassSurface
      material="standard"
      elevation="e2"
      className={cn(
        "sticky top-3 z-40 mx-auto w-full rounded-[5.5px] px-4 py-3 sm:px-6 sm:py-4",
        className
      )}
      {...props}
    />
  );
}
