import type { Metadata } from "next";

const siteConfig = {
  name: "Cumulus",
  title: "Cumulus Create",
  tagline: "npm create @cmls@latest my-acme",
  description:
    "Run npm create @cmls@latest my-acme to create a ready Cumulus app.",
  url: "https://cumulush.com",
  twitterHandle: "@cumulus",
  keywords: [
    "Cumulus",
    "Cumulus Create",
    "npm create @cmls",
    "Relay",
    "developer tools",
    "Cumulus app",
  ],
} as const;

type BuildMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  keywords?: string[];
  noIndex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path = "/",
  keywords,
  noIndex = false,
}: BuildMetadataOptions = {}): Metadata {
  const pageTitle = title ? `${title} · ${siteConfig.name}` : siteConfig.title;
  const desc = description ?? siteConfig.description;
  const url = new URL(path, siteConfig.url).toString();
  const ogTitle = title
    ? `${title} · ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;

  return {
    title: { absolute: pageTitle },
    description: desc,
    keywords: keywords ?? [...siteConfig.keywords],
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      title: ogTitle,
      description: desc,
      url,
      siteName: siteConfig.name,
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title: ogTitle,
      description: desc,
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export { siteConfig };
