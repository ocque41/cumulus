import type { ReactNode } from "react";

import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";

type MarketingLayoutShellProps = {
  children: ReactNode;
};

export function MarketingLayoutShell({ children }: MarketingLayoutShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1 flex-col">
        {children}
        <Footer />
      </div>
    </div>
  );
}
