import type { Metadata } from "next";

import { CumulusCreatePage } from "@/components/marketing/cumulus-create-page";

export const metadata: Metadata = {
  title: "Cumulus Create",
  description: "Use npm create @cmls@latest my-acme to create the Cumulus app shape you choose.",
};

export function generateStaticParams() {
  return [{ id: "cumulus-create" }, { id: "cumulus-db" }];
}

export default function ProductPage() {
  return <CumulusCreatePage />;
}
