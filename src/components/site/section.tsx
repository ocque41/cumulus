import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SectionProps {
  title: string;
  eyebrow?: string;
  copy?: string;
  children?: ReactNode;
  className?: string;
  as?: SectionTag;
}

type SectionTag = "section" | "div" | "article" | "aside" | "main" | "header" | "footer" | "nav";

export function Section({
  title,
  eyebrow,
  copy,
  children,
  className,
  as: Tag = "section",
}: SectionProps) {
  return (
    <Tag className={cn("container py-20", className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <span className="uppercase tracking-[0.2em] text-[color:var(--muted)] text-xs">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="mt-3 text-3xl font-semibold leading-tight">
          {title}
        </h2>
        {copy ? <p className="mt-4 text-[color:var(--muted)]">{copy}</p> : null}
      </div>
      {children ? <div className="mt-10">{children}</div> : null}
    </Tag>
  );
}
