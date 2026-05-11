import type { Metadata } from "next";

const siteConfig = {
  name: "Cumulus",
  title: "Cumulus",
  tagline: "Tools, products, and games for people who build.",
  description:
    "A small studio shipping independent projects — currently Tado and Relay.",
  url: "https://cumulush.com",
  twitterHandle: "@cumulus",
  keywords: [
    "Cumulus",
    "Tado",
    "Relay",
    "AI coding agents",
    "developer tools",
    "indie studio",
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
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: desc,
      creator: siteConfig.twitterHandle,
      site: siteConfig.twitterHandle,
      images: [
        {
          url: "/twitter-image",
          width: 1200,
          height: 630,
          alt: `${siteConfig.name} — ${siteConfig.tagline}`,
        },
      ],
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
