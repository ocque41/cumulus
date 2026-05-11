import * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "./input";

type GlassInputProps = React.ComponentProps<typeof Input> & {
  label?: string;
  hint?: string;
};

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;

    return (
      <div className="space-y-2">
        {label ? (
          <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--subtitle)]">
            {label}
          </label>
        ) : null}
        <Input ref={ref} id={inputId} variant="glass" className={cn(className)} {...props} />
        {hint ? <p className="text-xs text-[color:var(--glass-text-muted)]">{hint}</p> : null}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";
