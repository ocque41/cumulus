import { redirect } from "next/navigation";

import { legalMeta } from "@/lib/legal/data";

export const dynamic = "force-static";

export default function TermsOfServiceRedirect() {
  return redirect(`/${legalMeta.legal.defaultLanguage}/terms-of-service`);
}
