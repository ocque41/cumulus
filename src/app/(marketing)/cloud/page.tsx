import type { Metadata } from "next";

import { CumulusPage } from "@/components/marketing/cumulus-page";

export const metadata: Metadata = {
  title: "Cumulus",
  description: "Choose cloud, local, or both Cumulus DB paths for a generated Cumulus app.",
};

export default function CloudPage() {
  return <CumulusPage />;
}
