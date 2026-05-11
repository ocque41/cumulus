import * as React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: keyof React.JSX.IntrinsicElements;
};

/**
 * EditorialCard — the one Cumulus container.
 * 5.5px radius, 1px hairline border, no shadow.
 * Per /Users/miguel/Documents/cumulus/CUMULUS-BRAND.md.
 */
export function EditorialCard({ as = "article", className, children, ...rest }: Props) {
  const Tag = as as any;
  return (
    <Tag
      className={cn(
        "rounded-[5.5px] border border-[color:var(--hairline)] bg-[color:var(--bg)] p-7",
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}
