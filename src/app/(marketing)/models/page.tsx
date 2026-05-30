import type { Metadata } from "next";

import { CumulusPage } from "@/components/marketing/cumulus-page";

export const metadata: Metadata = {
  title: "Cumulus",
  description: "Pick the Cumulus template and flags for your app.",
};

export default function ModelsPage() {
  return <CumulusPage />;
}
