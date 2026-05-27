import type { Viewport } from "next";
import type { ReactNode } from "react";

import { ViewTunnelProvider, ExperienceShell } from "@/components/core";
import { MarketingLayoutShell } from "@/components/site/marketing-layout-shell";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata({
  title: "Cumulus Create",
  description: "Run npm create @cmls@latest my-acme to create a ready Cumulus app.",
  path: "/contact",
});

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
};

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <ViewTunnelProvider>
      <ExperienceShell>
        <MarketingLayoutShell>{children}</MarketingLayoutShell>
      </ExperienceShell>
    </ViewTunnelProvider>
  );
}
