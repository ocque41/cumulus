"use client";

import * as React from "react";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type MicroagentsSendProps = {
  placeholder?: string;
  helperText?: string;
  className?: string;
  onSubmit?: (value: string) => void;
};

export function MicroagentsSend({
  placeholder = "Send a prompt to your microagents",
  helperText = "Queued requests are dispatched concurrently",
  className,
  onSubmit,
}: MicroagentsSendProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const value = (formData.get("microagents-input") as string) || "";

    if (onSubmit) {
      onSubmit(value);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "rounded-[5.5px] border border-[color:var(--muted)]/30 bg-[rgba(255,255,255,0.02)] p-4",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Input
          name="microagents-input"
          placeholder={placeholder}
          className="h-11 rounded-[5.5px] border-[color:var(--muted)]/30 bg-transparent text-[color:var(--fg)]"
        />
        <Button type="submit" size="icon" className="h-11 w-11 rounded-[5.5px]">
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
      <p className="mt-2 text-xs text-[color:var(--muted)]">{helperText}</p>
    </form>
  );
}
