import Link from "next/link";

import { LanguageSwitcher } from "@/components/site/language-switcher";

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
};

const sections: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Navigate",
    links: [
      { href: "/", label: "Home" },
      { href: "/products", label: "Products" },
      { href: "/cloud", label: "Cloud" },
      { href: "/models", label: "Models" },
      { href: "/docs", label: "Docs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Workspace",
    links: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/dashboard/database", label: "Database" },
      { href: "/dashboard/system", label: "System" },
      { href: "/settings", label: "Settings" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign In" },
      { href: "/signup", label: "Create Account" },
      { href: "https://www.npmjs.com/package/create-cumulus", label: "create-cumulus", external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy-policy", label: "Privacy" },
      { href: "/terms-of-service", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  const className =
    "text-sm text-[color:var(--muted)] transition hover:text-[color:var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--fg)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]";

  if (link.external) {
    return (
      <a href={link.href} className={className} target="_blank" rel="noreferrer">
        {link.label}
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="w-full bg-transparent pb-8 pt-16">
      <div className="container flex flex-col gap-12 px-4 text-left">
        <div className="flex items-start gap-[10px]">
          <span
            aria-hidden
            className="mt-[3px] inline-block h-[6px] w-[6px] rounded-full bg-[color:var(--color-terracotta)]"
          />
          <span className="flex flex-col font-mono uppercase leading-none">
            <span className="text-[11px] font-semibold text-[color:var(--text)]">
              Cumulus
            </span>
            <span className="mt-[4px] text-[9px] font-normal text-[color:var(--muted)]">
              by Cumulus
            </span>
          </span>
        </div>
        <nav aria-label="Footer navigation" className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-mono text-xs uppercase text-[color:var(--text)]">{section.title}</h2>
              <ul className="mt-4 flex flex-col gap-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="flex">
          <LanguageSwitcher />
        </div>
      </div>
    </footer>
  );
}
