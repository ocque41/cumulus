"use client";

import * as React from "react";

import { useLiquidInteraction } from "@/hooks/use-liquid-interaction";
import { cn } from "@/lib/utils";

type InputVariant = "glass" | "solid";

type InputProps = React.ComponentProps<"input"> & {
  error?: boolean;
  variant?: InputVariant;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error = false, variant = "glass", onFocus, onBlur, ...props }, ref) => {
    const liquidHandlers = useLiquidInteraction({ disabled: variant !== "glass" });

    return (
      <input
        ref={ref}
        type={type}
        data-slot="input"
        className={cn(
          "h-11 w-full rounded-[5.5px] px-3 py-2 text-sm shadow-sm transition-[border-color,box-shadow,background-color,transform]",
          "placeholder:text-[color:var(--glass-text-muted)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--glass-text-body)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
          variant === "glass" &&
            "glass-surface glass-standard glass-e1 bg-transparent text-[color:var(--glass-text-body)]",
          variant === "solid" &&
            "border border-[color:var(--muted)]/35 bg-[color:var(--bg)] text-[color:var(--fg)]",
          error &&
            "border-red-400/70 focus-visible:ring-red-300/80 focus-visible:ring-offset-[color:var(--bg)]",
          className
        )}
        onFocus={(event) => {
          liquidHandlers.onFocus(event as unknown as React.FocusEvent<HTMLElement>);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          liquidHandlers.onBlur(event as unknown as React.FocusEvent<HTMLElement>);
          onBlur?.(event);
        }}
        onMouseEnter={(event) => liquidHandlers.onMouseEnter(event as unknown as React.MouseEvent<HTMLElement>)}
        onMouseLeave={(event) => liquidHandlers.onMouseLeave(event as unknown as React.MouseEvent<HTMLElement>)}
        onPointerDown={(event) => liquidHandlers.onPointerDown(event as unknown as React.PointerEvent<HTMLElement>)}
        onPointerUp={(event) => liquidHandlers.onPointerUp(event as unknown as React.PointerEvent<HTMLElement>)}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
