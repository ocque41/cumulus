import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative isolate min-h-screen overflow-x-clip", className)}>
      {children}
    </div>
  );
}
