import type { Viewport } from "next";
import type { ReactNode } from "react";

import { MarketingLayoutShell } from "@/components/site/marketing-layout-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Cumulus",
  description: "Run npm create @cmls@latest to create a ready Cumulus app.",
  path: "/contact",
});

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return <MarketingLayoutShell>{children}</MarketingLayoutShell>;
}
