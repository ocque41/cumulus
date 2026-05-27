import type { Viewport } from "next";
import type { ReactNode } from "react";

import { MarketingLayoutShell } from "@/components/site/marketing-layout-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata();

export const viewport: Viewport = {
  themeColor: "#171717",
  colorScheme: "dark",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <MarketingLayoutShell>{children}</MarketingLayoutShell>;
}
