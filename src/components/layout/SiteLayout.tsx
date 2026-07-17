import type { ReactNode } from "react";

import { BottomBlur, TopBlur } from "@/components/visual/EdgeBlur";

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
      <TopBlur height={54} />
      <SiteHeader onOpenAuth={onOpenAuth} />
      <main id="main-content">{children}</main>
      <SiteFooter />
      <BottomBlur height={60} />
    </div>
  );
}
