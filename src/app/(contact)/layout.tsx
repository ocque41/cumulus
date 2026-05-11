import type { Viewport } from "next";
import type { ReactNode } from "react";


import { DesktopNav } from "@/components/site/nav";
import { PageBackground } from "@/components/site/page-background";
import { Toaster } from "@/components/ui/toaster";
import { ViewTunnelProvider, ExperienceShell } from "@/components/core";
import { buildMetadata } from "@/lib/metadata";

import { Footer } from "@/components/site/footer";

export const metadata = buildMetadata({
  title: "Enterprise",
  description:
    "Enterprise engagements for any Cumulus project — customization, exclusivity, or tailored assemblies from the catalog.",
  path: "/contact",
});

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <ViewTunnelProvider>
      <ExperienceShell>
        <PageBackground color="#1a1a1a" />
        <div className="min-h-screen flex flex-col">
          {/* Header removed for contact page */}
          {/* Page shell: sidebar + content. Ends before footer in root layout */}
          <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-12 px-4 pb-0 pt-12 lg:px-8">
            {/* Sticky Sidebar */}
            <aside className="hidden w-40 shrink-0 xl:block">
              <div className="sticky top-[50vh] -translate-y-1/2">
                <DesktopNav />
              </div>
            </aside>
            {/* Main Content & Footer */}
            <div className="flex flex-1 flex-col min-w-0">
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </div>
          <Toaster />
          <Toaster />
        </div>
      </ExperienceShell>
    </ViewTunnelProvider>
  );
}
