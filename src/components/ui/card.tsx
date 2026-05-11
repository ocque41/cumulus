"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { GlassElevation, GlassMaterial } from "@/types/ui-preferences";

import { GlassSurface } from "./glass-surface";

type CardVariant = "glass" | "solid" | "plain";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  material?: GlassMaterial;
  elevation?: GlassElevation;
  noisy?: boolean;
  interactive?: boolean;
};

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      style,
      children,
      variant = "glass",
      material = "standard",
      elevation = "e2",
      noisy = false,
      interactive = false,
      ...props
    },
    ref
  ) => {
    if (variant === "glass") {
      return (
        <GlassSurface
          ref={ref}
          material={material}
          elevation={elevation}
          noisy={noisy}
          interactive={interactive}
          className={cn("text-[color:var(--glass-text-body)]", className)}
          style={style}
          {...props}
        >
          {children}
        </GlassSurface>
      );
    }

    if (variant === "solid") {
      return (
        <div
          ref={ref}
          className={cn(
            "rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[color:var(--bg)] text-[color:var(--fg)] shadow-[0_14px_32px_rgba(0,0,0,0.32)]",
            className
          )}
          style={style}
          {...props}
        >
          {children}
        </div>
      );
    }

    return (
      <div ref={ref} className={cn("rounded-[5.5px] text-[color:var(--fg)]", className)} style={style} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col gap-2 p-6", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn("text-xl font-semibold", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-[color:var(--glass-text-muted)]", className)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
