import Link from "next/link";

import { CREATE_SHORT_COMMAND } from "@/lib/cumulus-create";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
];

export function DesktopNav() {
  return (
    <div className="flex flex-col gap-5 rounded-[5.5px] border border-[color:var(--hairline)] p-4">
      <code className="font-mono text-xs leading-6 text-[color:var(--subtitle)]">{CREATE_SHORT_COMMAND}</code>
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-[color:var(--muted)] hover:text-[color:var(--title)]">
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
      className="rounded-[5.5px] border border-[color:var(--hairline)] px-3 py-2 text-sm text-[color:var(--title)]"
    >
      Menu
    </button>
  );
}

export function NavSheetContent() {
  return (
    <nav aria-label="Mobile" className="rounded-[5.5px] border border-[color:var(--hairline)] p-4">
      <ul className="flex flex-col gap-4 text-lg">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-[color:var(--title)]">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
