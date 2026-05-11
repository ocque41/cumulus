"use client";

import * as React from "react";

import { useLiquidInteraction } from "@/hooks/use-liquid-interaction";
import { cn } from "@/lib/utils";
import type { GlassElevation, GlassMaterial } from "@/types/ui-preferences";

type GlassSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  material?: GlassMaterial;
  elevation?: GlassElevation;
  noisy?: boolean;
  interactive?: boolean;
};

const materialClass: Record<GlassMaterial, string> = {
  subtle: "glass-subtle",
  standard: "glass-standard",
  strong: "glass-strong",
  solid: "glass-solid",
};

const elevationClass: Record<GlassElevation, string> = {
  e1: "glass-e1",
  e2: "glass-e2",
  e3: "glass-e3",
  e4: "glass-e4",
};

export const GlassSurface = React.forwardRef<HTMLDivElement, GlassSurfaceProps>(
  (
    { className, material = "standard", elevation = "e2", noisy = false, interactive = false, children, ...props },
    ref
  ) => {
    const liquidHandlers = useLiquidInteraction({ disabled: !interactive });

    return (
      <div
        ref={ref}
        className={cn(
          "glass-surface rounded-[5.5px]",
          materialClass[material],
          elevationClass[elevation],
          noisy && "glass-noise",
          className
        )}
        {...(interactive ? liquidHandlers : {})}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassSurface.displayName = "GlassSurface";
