import type { Metadata } from "next";

import { CumulusPage } from "@/components/marketing/cumulus-page";

export const metadata: Metadata = {
  title: "Cumulus",
  description: "Build a Cumulus command and create a ready Cumulus app.",
};

export default function DocsPage() {
  return <CumulusPage />;
}
