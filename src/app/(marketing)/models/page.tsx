import type { Metadata } from "next";

import { CumulusCreatePage } from "@/components/marketing/cumulus-create-page";

export const metadata: Metadata = {
  title: "Cumulus Create",
  description: "Pick the Cumulus Create template and flags for your app.",
};

export default function ModelsPage() {
  return <CumulusCreatePage />;
}
