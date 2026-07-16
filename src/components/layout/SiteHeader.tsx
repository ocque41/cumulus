import { useState } from "react";

import { AppLink, useRoute } from "@/lib/router";

interface SiteHeaderProps {
  onOpenAuth: () => void;
}

export function SiteHeader({ onOpenAuth }: SiteHeaderProps) {
  const { pathname } = useRoute();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="site-header" data-open={menuOpen || undefined}>
      <div className="site-header__inner">
        <AppLink
          className="wordmark"
          href="/"
          aria-label="Cumulus home"
          onClick={() => setMenuOpen(false)}
        >
          CUMULUS<span>lab</span>
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
            aria-current={pathname.startsWith("/logs") ? "page" : undefined}
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
          <a
            href="https://github.com/ocque41?tab=repositories"
            onClick={() => setMenuOpen(false)}
            rel="noreferrer"
            target="_blank"
          >
            Public work
          </a>
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
