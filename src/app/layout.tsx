import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Toaster } from "@/components/ui/sonner";
import { KonamiEasterEgg, GlitchModeProvider } from "@/components/effects";
import { TransitionCurtain } from "@/components/motion/TransitionCurtain";
import { AuthProvider } from "@/components/providers/auth-provider";
import { UiPreferencesProvider } from "@/components/providers/ui-preferences-provider";
import { AppShell } from "@/components/shell/AppShell";
import { AutoLocaleDetect } from "@/components/site/auto-locale-detect";

import "./globals.css";

// Per the master Cumulus brand spec: exactly two font families load.
// - Plus Jakarta Sans = the only readable typeface (display + body)
// - JetBrains Mono   = the unavoidable data partner (kickers, mono meta, code)
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

const SITE_URL = "https://cumulush.com";
const SITE_NAME = "Cumulus";
const SITE_DESCRIPTION =
  "A small studio shipping tools and infrastructure for AI-first software. Independent products, one quiet studio.";
const SITE_TAGLINE =
  "Tools and infrastructure for people building with AI.";
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
    template: "%s · Tado",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "developer tools",
  keywords: [
    "Cumulus",
    "Tado",
    "Relay",
    "AI coding agents",
    "developer tools",
    "indie studio",
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
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    creator: "@cumulus",
    site: "@cumulus",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — ${SITE_TAGLINE}`,
      },
    ],
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
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: initialThemeScript }} />
      </head>
      <body className="bg-[color:var(--color-ink)] text-[color:var(--color-paper)] min-h-screen" suppressHydrationWarning>
        <AuthProvider>
          <UiPreferencesProvider productKey="hub">
            <GlitchModeProvider>
              <KonamiEasterEgg>
                {/* The Curtain is the global overlay for page transitions */}
                <TransitionCurtain />

                {/* Main Content Area */}
                <AppShell>
                  <AutoLocaleDetect />
                  <main className="min-h-screen w-full relative z-0">
                    {children}
                  </main>
                </AppShell>

                <Toaster />
              </KonamiEasterEgg>
            </GlitchModeProvider>
          </UiPreferencesProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
