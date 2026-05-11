import Link from "next/link";

import { LanguageSwitcher } from "@/components/site/language-switcher";

const links = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="w-full bg-transparent pb-8 pt-16">
      <div className="container flex flex-col gap-12 px-4 text-left">
        {/* Cumulus brand mark per master spec */}
        <div className="flex items-start gap-[10px]">
          <span
            aria-hidden
            className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--color-terracotta)]"
          />
          <span className="flex flex-col font-mono uppercase leading-none">
            <span className="text-[11px] font-semibold tracking-[0.22em] text-[color:var(--text)]">
              Cumulus
            </span>
            <span className="mt-[4px] text-[9px] font-normal tracking-[0.16em] text-[color:var(--muted)]">
              by Cumulus
            </span>
          </span>
        </div>
        <div className="flex flex-col justify-center">
          <nav aria-label="Footer navigation" className="w-full">
            <ul className="flex flex-col items-start gap-6 text-lg text-[color:var(--fg)]/80">
              {links.map((link) => (
                <li key={link.href} className="w-full max-w-xs">
                  <Link
                    href={link.href}
                    className="block rounded-[5.5px] border border-transparent px-6 py-3 text-left transition hover:border-[color:var(--hairline)] hover:text-[color:var(--fg)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="flex">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
