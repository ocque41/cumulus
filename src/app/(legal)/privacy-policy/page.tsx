import { redirect } from "next/navigation";

import { legalMeta } from "@/lib/legal/data";

export const dynamic = "force-static";

export default function PrivacyPolicyRedirect() {
  return redirect(`/${legalMeta.legal.defaultLanguage}/privacy-policy`);
}
