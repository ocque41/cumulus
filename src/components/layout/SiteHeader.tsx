import { useState } from "react";

import { DitherCloudMark } from "@/components/brand/DitherCloudMark";
import { AppLink, usePathname } from "@/lib/router";

interface SiteHeaderProps {
  onOpenAuth: () => void;
}

export function SiteHeader({ onOpenAuth }: SiteHeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const logsCurrent = pathname === "/logs" || pathname.startsWith("/logs/");

  return (
    <header className="site-header" data-open={menuOpen || undefined}>
      <div className="site-header__inner">
        <AppLink
          className="wordmark"
          href="/"
          aria-label="Cumulus home"
          onClick={() => setMenuOpen(false)}
        >
          <DitherCloudMark className="wordmark__cloud" decorative />
          <span className="wordmark__name">CUMULUS</span>
          <span className="wordmark__lab">lab</span>
        </AppLink>

        <button
          aria-controls="primary-navigation"
          aria-expanded={menuOpen}
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? "Close" : "Menu"}
        </button>

        <nav
          aria-label="Primary navigation"
          className="primary-navigation"
          id="primary-navigation"
        >
          <AppLink
            aria-current={logsCurrent ? "page" : undefined}
            href="/logs"
            onClick={() => setMenuOpen(false)}
          >
            Log index
          </AppLink>
          <AppLink href="/#github" onClick={() => setMenuOpen(false)}>
            GitHub
          </AppLink>
          <AppLink href="/#notify" onClick={() => setMenuOpen(false)}>
            Notifications
          </AppLink>
          <AppLink
            aria-current={pathname === "/work" ? "page" : undefined}
            href="/work"
            onClick={() => setMenuOpen(false)}
          >
            Public work
          </AppLink>
          <button
            className="nav-action"
            onClick={() => {
              setMenuOpen(false);
              onOpenAuth();
            }}
            type="button"
          >
            Sign in
          </button>
        </nav>
      </div>
    </header>
  );
}
