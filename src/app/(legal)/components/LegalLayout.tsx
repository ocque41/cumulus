import type { ReactNode } from "react";

import Link from "next/link";

import { LegalLastUpdated } from "./LegalLastUpdated";
import { LegalToc } from "./LegalToc";
import type { LegalHeading } from "@/lib/legal/mdx";
import type { LegalSlug, SupportedLocale } from "@/lib/legal/schema";

const titleMap: Record<LegalSlug, { en: string; es: string }> = {
  "privacy-policy": {
    en: "Privacy Policy",
    es: "Política de privacidad",
  },
  "terms-of-service": {
    en: "Terms of Service",
    es: "Términos de servicio",
  },
};

const legalLabel: Record<SupportedLocale, string> = {
  en: "Legal",
  es: "Legal",
};

const cookiesLabel: Record<SupportedLocale, string> = {
  en: "Read how we use cookies",
  es: "Lee cómo usamos las cookies",
};

type LegalLayoutProps = {
  children: ReactNode;
  slug: LegalSlug;
  locale: SupportedLocale;
  description: string;
  headings: LegalHeading[];
  lastUpdated: string;
};

export function LegalLayout({
  children,
  slug,
  locale,
  description,
  headings,
  lastUpdated,
}: LegalLayoutProps) {
  const pageTitle = titleMap[slug][locale];
  return (
    <main className="container mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 lg:flex-row">
      <aside className="lg:w-72 lg:flex-shrink-0">
        <div className="glass-surface glass-standard glass-e2 sticky top-24 flex flex-col gap-6 rounded-[5.5px] p-6">
          <div className="border-b border-[color:var(--glass-border-base)] pb-4">
            <p className="text-sm uppercase tracking-wide text-[color:var(--muted)]">{legalLabel[locale]}</p>
            <nav aria-label="Breadcrumb" className="mt-2 text-sm text-[color:var(--muted)]/80">
              <ol className="flex flex-col gap-1">
                <li>
                  <Link
                    href="/"
                    className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--glass-text-body)]"
                  >
                    Cumulus
                  </Link>
                </li>
                <li aria-current="page" className="font-medium text-[color:var(--fg)]">
                  {pageTitle}
                </li>
              </ol>
            </nav>
          </div>
          <LegalLastUpdated lastUpdated={lastUpdated} locale={locale} />
          <LegalToc headings={headings} locale={locale} />
          <div className="text-sm text-[color:var(--muted)]">
            <Link
              href="/cookies"
              className="rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--glass-text-body)]"
            >
              {cookiesLabel[locale]}
            </Link>
          </div>
        </div>
      </aside>
      <article className="glass-surface glass-standard glass-e3 prose prose-invert max-w-none flex-1 space-y-6 rounded-[5.5px] p-6 text-[color:var(--fg)] sm:p-8">
        <header className="space-y-4 border-b border-[color:var(--glass-border-base)] pb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--glass-text-title)] sm:text-4xl">{pageTitle}</h1>
          <p className="text-lg text-[color:var(--muted)]">{description}</p>
        </header>
        <div className="space-y-8">{children}</div>
      </article>
    </main>
  );
}
