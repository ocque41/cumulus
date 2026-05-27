import type { Metadata } from "next";

import { CumulusCreatePage } from "@/components/marketing/cumulus-create-page";

export const metadata: Metadata = {
  title: "Cumulus Create",
  description: "Build a Cumulus Create command and create a ready Cumulus app.",
};

export default function DocsPage() {
  return <CumulusCreatePage />;
}
