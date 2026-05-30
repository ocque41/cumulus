import type { Metadata } from "next";

import { CumulusPage } from "@/components/marketing/cumulus-page";

export const metadata: Metadata = {
  title: "Cumulus",
  description: "Create a Cumulus app with auth, data, Knowledge, Relay, and Cumulus DB choices.",
};

export default function ProductsPage() {
  return <CumulusPage />;
}
