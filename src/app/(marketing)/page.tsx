import type { Metadata, Viewport } from "next";

import { CumulusCreatePage } from "@/components/marketing/cumulus-create-page";

export const metadata: Metadata = {
  title: { absolute: "Cumulus Create" },
  description: "Run npm create @cmls@latest my-acme to create a ready Cumulus app.",
};

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  colorScheme: "dark",
};

export default function HomePage() {
  return <CumulusCreatePage />;
}
