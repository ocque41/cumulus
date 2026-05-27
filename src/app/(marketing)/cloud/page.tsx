import type { Metadata } from "next";

import { CumulusCreatePage } from "@/components/marketing/cumulus-create-page";

export const metadata: Metadata = {
  title: "Cumulus Create",
  description: "Choose cloud, local, or both Cumulus DB paths for a generated Cumulus app.",
};

export default function CloudPage() {
  return <CumulusCreatePage />;
}
