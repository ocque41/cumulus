import type { Metadata } from "next";

import { CumulusPage } from "@/components/marketing/cumulus-page";

export const metadata: Metadata = {
  title: "Cumulus",
  description: "Use npm create @cmls@latest to create the Cumulus app shape you choose.",
};

export function generateStaticParams() {
  return [{ id: "cumulus" }, { id: "cumulus-db" }];
}

export default function ProductPage() {
  return <CumulusPage />;
}
