import type { Metadata } from "next";

const siteConfig = {
  name: "Cumulus",
  title: "Cumulus",
  tagline: "npm create @cmls@latest",
  description:
    "Run npm create @cmls@latest to create a ready-to-deploy agentic Cumulus app.",
  url: "https://cumulush.com",
  twitterHandle: "@cumulus",
  keywords: [
    "Cumulus",
    "npm create @cmls",
    "Relay",
    "developer tools",
    "Cumulus app",
  ],
} as const;

const socialPreviewVersion = "20260531-1";
const openGraphImageUrl = `${siteConfig.url}/opengraph-image?v=${socialPreviewVersion}`;
const twitterImageUrl = `${siteConfig.url}/twitter-image?v=${socialPreviewVersion}`;

const openGraphImage = {
  url: openGraphImageUrl,
  secureUrl: openGraphImageUrl,
  type: "image/png",
  width: 1200,
  height: 630,
  alt: "Cumulus social preview",
} as const;

const twitterImage = {
  url: twitterImageUrl,
  secureUrl: twitterImageUrl,
  type: "image/png",
  width: 1200,
  height: 630,
  alt: openGraphImage.alt,
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
      images: [openGraphImage],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
      images: [twitterImage],
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
