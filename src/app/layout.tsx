import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/components/providers/auth-provider";
import { UiPreferencesProvider } from "@/components/providers/ui-preferences-provider";
import { AppShell } from "@/components/shell/AppShell";
import { AutoLocaleDetect } from "@/components/site/auto-locale-detect";

import "./globals.css";

const plusJakartaSans = localFont({
  src: "../fonts/PlusJakartaSans-VariableFont_wght.ttf",
  variable: "--font-display",
  display: "swap",
  weight: "200 800",
});

const spaceGrotesk = localFont({
  src: "../fonts/SpaceGrotesk-VariableFont_wght.ttf",
  variable: "--font-body",
  display: "swap",
  weight: "300 700",
});

const draftingMono = localFont({
  src: [
    {
      path: "../fonts/DraftingMono-Regular.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/DraftingMono-Medium.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/DraftingMono-SemiBold.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://cumulush.com";
const SITE_NAME = "Cumulus";
const SITE_DESCRIPTION =
  "Run npm create @cmls@latest to create a ready-to-deploy agentic Cumulus app.";
const SITE_TAGLINE = "npm create @cmls@latest";
const SOCIAL_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Cumulus social preview",
} as const;
const UI_PREFERENCES_STORAGE_KEY = "cumulus_ui_preferences:hub";
const initialThemeScript = `
(() => {
  try {
    const raw = window.localStorage.getItem(${JSON.stringify(UI_PREFERENCES_STORAGE_KEY)});
    const parsed = raw ? JSON.parse(raw) : null;
    const mode = parsed && typeof parsed.themeMode === "string" ? parsed.themeMode : "system";
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    const theme = mode === "light" || mode === "dark" ? mode : prefersLight ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", theme);
  } catch {
    document.documentElement.setAttribute("data-theme", "dark");
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s · Cumulus",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "developer tools",
  keywords: [
    "Cumulus",
    "npm create @cmls",
    "Relay",
    "developer tools",
    "Cumulus app",
  ],
  authors: [{ name: "Cumulus", url: SITE_URL }],
  creator: "Cumulus",
  publisher: "Cumulus",
  alternates: {
    canonical: "/",
    languages: {
      en: "/",
      es: "/",
    },
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    alternateLocale: ["es_ES"],
    images: [SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    creator: "@cumulus",
    site: "@cumulus",
    images: [SOCIAL_IMAGE.url],
  },
  robots: {
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
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${plusJakartaSans.variable} ${spaceGrotesk.variable} ${draftingMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body className="min-h-screen bg-[color:var(--color-ink)] text-[color:var(--color-paper)]" suppressHydrationWarning>
        <AuthProvider>
          <UiPreferencesProvider productKey="hub">
            <AppShell>
              <AutoLocaleDetect />
              <main className="relative z-0 min-h-screen w-full">
                {children}
              </main>
            </AppShell>
            <Toaster />
          </UiPreferencesProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
