"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type CopyCommandProps = {
  command: string;
  className?: string;
  codeClassName?: string;
  label?: string;
};

export function CopyCommand({
  command,
  className,
  codeClassName,
  label = "Copy",
}: CopyCommandProps) {
  const [copied, setCopied] = useState(false);

  async function copyCommand() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={copyCommand}
      className={cn(
        "flex w-fit max-w-full items-start gap-3 rounded-[5.5px] border border-[color:var(--hairline)] bg-transparent px-3 py-2 text-left font-mono text-xs text-[color:var(--title)]",
        className,
      )}
      aria-label={`Copy command: ${command}`}
      title="Copy command"
    >
      <code className={cn("block min-w-0 overflow-x-auto whitespace-pre-wrap leading-6", codeClassName)}>
        {command}
      </code>
      <span className="shrink-0 border-l border-[color:var(--hairline)] pl-3 text-[10px] uppercase text-[color:var(--muted)]">
        {copied ? "Copied" : label}
      </span>
    </button>
  );
}
