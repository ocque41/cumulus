import { NextResponse } from "next/server";

import { cumulusDbTokenFetch, requireCumulusUser } from "@/lib/cumulus-db/server";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tokenId: string }> },
) {
  const user = await requireCumulusUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, tokenId } = await params;
  return cumulusDbTokenFetch(
    request,
    `/v1/databases/${encodeURIComponent(id)}/tokens/${encodeURIComponent(tokenId)}`,
    { method: "DELETE" },
  );
}
