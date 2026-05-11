import { NextResponse } from "next/server";
import {
  cumulusDbAdminFetch,
  isCumulusDbAdminApiEnabled,
  requireCumulusUser,
} from "@/lib/cumulus-db/server";

export async function GET() {
  const user = await requireCumulusUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isCumulusDbAdminApiEnabled()) {
    return NextResponse.json(
      {
        error:
          "Workspace listing is disabled in the public build. Connect with a database id and scoped bearer token.",
      },
      { status: 403 },
    );
  }
  return cumulusDbAdminFetch("/v1/databases");
}
