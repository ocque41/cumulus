import type { Metadata } from "next";

import { CumulusCreatePage } from "@/components/marketing/cumulus-create-page";

export const metadata: Metadata = {
  title: "Cumulus Create",
  description: "Create a Cumulus app with auth, data, Knowledge, Relay, and Cumulus DB choices.",
};

export default function ProductsPage() {
  return <CumulusCreatePage />;
}
