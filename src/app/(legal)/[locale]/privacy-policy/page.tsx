import type { Metadata } from "next";
import Script from "next/script";

import { LegalLayout } from "../../components/LegalLayout";
import { legalMeta } from "@/lib/legal/data";
import { loadLegalDocument } from "@/lib/legal/mdx";
import {
  type LegalSlug,
  type SupportedLocale,
  supportedLocales,
} from "@/lib/legal/schema";

const slug: LegalSlug = "privacy-policy";

export const dynamic = "force-static";

export function generateStaticParams() {
  return supportedLocales.map((locale) => ({ locale }));
}

function resolveLocale(localeParam: string): SupportedLocale {
  if (supportedLocales.includes(localeParam as SupportedLocale)) {
    return localeParam as SupportedLocale;
  }

  return legalMeta.legal.defaultLanguage;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const { frontMatter } = await loadLegalDocument({ slug, locale });
  const noindex = legalMeta.legal.noindexUntilApproved;
  const path = `/${locale}/${frontMatter.slug}`;
  const languages = Object.fromEntries(
    supportedLocales.map((supportedLocale) => [supportedLocale, `/${supportedLocale}/${frontMatter.slug}`])
  );
  languages["x-default"] = `/${legalMeta.legal.defaultLanguage}/${frontMatter.slug}`;

  return {
    title: frontMatter.title,
    description: frontMatter.description,
    alternates: {
      canonical: path,
      languages,
    },
    openGraph: {
      title: frontMatter.title,
      description: frontMatter.description,
      url: `${legalMeta.company.website}${path}`,
      locale,
      siteName: legalMeta.company.displayName,
      images: ["/opengraph-image"],
    },
    twitter: {
      card: "summary_large_image",
      title: frontMatter.title,
      description: frontMatter.description,
      images: ["/twitter-image"],
    },
    robots: {
      index: !noindex,
      follow: !noindex,
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  const document = await loadLegalDocument({ slug, locale });
  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: legalMeta.company.displayName,
    legalName: legalMeta.company.legalName,
    url: legalMeta.company.website,
    email: legalMeta.company.contactEmail,
    address: legalMeta.company.address,
  };
  const jsonLdWebsite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: legalMeta.company.displayName,
    url: legalMeta.company.website,
    inLanguage: locale === "es" ? "es-ES" : "en-GB",
  };

  return (
    <>
      <Script
        id="jsonld-organization"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <Script
        id="jsonld-website"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
      />
      <LegalLayout
        slug={slug}
        locale={document.locale}
        description={document.frontMatter.description}
        headings={document.headings}
        lastUpdated={document.frontMatter.lastUpdated ?? legalMeta.legal.lastUpdated}
      >
        {document.content}
      </LegalLayout>
    </>
  );
}
