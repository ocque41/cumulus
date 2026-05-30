import type { Metadata, Viewport } from "next";

import { CumulusPage } from "@/components/marketing/cumulus-page";

export const metadata: Metadata = {
  title: { absolute: "Cumulus" },
  description: "Run npm create @cmls@latest to create a ready Cumulus app.",
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
};

export default function HomePage() {
  return <CumulusPage />;
}
