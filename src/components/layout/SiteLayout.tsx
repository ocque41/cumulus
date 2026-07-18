import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

interface SiteLayoutProps {
  children: ReactNode;
  onOpenAuth: () => void;
}

export function SiteLayout({ children, onOpenAuth }: SiteLayoutProps) {
  return (
    <div className="site-frame">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <SiteHeader onOpenAuth={onOpenAuth} />
      <main id="main-content">{children}</main>
      <SiteFooter />
    </div>
  );
}
