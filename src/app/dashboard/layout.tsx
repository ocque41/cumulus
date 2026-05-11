import type { ReactNode } from "react";
import { ViewTunnelProvider, ExperienceShell } from "@/components/core";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { MobileSidebar } from "@/components/dashboard/mobile-sidebar";
import { Toaster } from "@/components/ui/toaster";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <ViewTunnelProvider>
            <ExperienceShell>
                <div className="min-h-screen flex flex-col bg-[var(--bg)]"> {/* Match dashboard page bg */}
                    <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-12 px-4 pb-0 pt-12 lg:px-8">
                        {/* Mobile Sidebar Toggle (Visible on < XL) */}
                        <div className="absolute top-4 left-4 xl:hidden z-20">
                            <MobileSidebar />
                        </div>

                        {/* Sticky Sidebar (Desktop > XL) */}
                        <aside className="hidden w-40 shrink-0 xl:block">
                            <div className="sticky top-[50vh] -translate-y-1/2">
                                <DashboardSidebar />
                            </div>
                        </aside>
                        {/* Main Content */}
                        <div className="flex flex-1 flex-col min-w-0">
                            <main className="flex-1">{children}</main>
                        </div>
                    </div>
                    <Toaster />
                </div>
            </ExperienceShell>
        </ViewTunnelProvider>
    );
}
