import Link from "next/link";
import type { ReactNode } from "react";

const dashboardLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/system", label: "System" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="border-b border-[color:var(--hairline)]">
        <div className="mx-auto flex w-full max-w-[1320px] gap-4 px-4 py-4 sm:px-6 lg:px-8">
          {dashboardLinks.map((link) => (
            <Link key={link.href} href={link.href} className="font-mono text-xs uppercase text-[color:var(--title)]">
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
      {children}
    </div>
  );
}
