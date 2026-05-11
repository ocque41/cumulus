import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/cloud", label: "Cloud" },
  { href: "/docs", label: "Docs" },
  { href: "/contact", label: "Contact" },
];

export function DesktopNav() {
  return (
    <div className="glass-surface glass-subtle glass-e1 flex flex-col gap-6 rounded-[5.5px] p-4">
      <span className="tracking-[0.3em] text-[11px] font-semibold text-[color:var(--title)] opacity-60">
        Navigate
      </span>
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm tracking-[-0.03em] text-[color:var(--glass-text-muted)] transition-colors duration-200 hover:text-[color:var(--glass-text-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--glass-text-body)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

export function MobileNavTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="glass-surface glass-standard glass-e1 inline-flex items-center gap-2 rounded-full border border-[color:var(--glass-border-base)] px-4 py-2 text-sm text-[color:var(--glass-text-body)] transition hover:border-[color:var(--glass-text-body)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--glass-text-body)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)] xl:hidden"
    >
      Menu
    </button>
  );
}

export function NavSheetContent() {
  return (
    <nav aria-label="Mobile" className="glass-surface glass-standard glass-e2 rounded-[5.5px] p-4">
      <ul className="flex flex-col gap-4 text-lg">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-[color:var(--fg)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
