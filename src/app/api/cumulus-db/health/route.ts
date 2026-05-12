import { cumulusDbPublicFetch } from "@/lib/cumulus-db/server";

export async function GET() {
  return cumulusDbPublicFetch("/health");
}
