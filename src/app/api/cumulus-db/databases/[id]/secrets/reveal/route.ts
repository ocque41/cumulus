import { NextResponse } from "next/server";
import { cumulusDbTokenFetch, requireCumulusUser } from "@/lib/cumulus-db/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await requireCumulusUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return cumulusDbTokenFetch(request, `/v1/databases/${encodeURIComponent(id)}/secrets/reveal`, {
    method: "POST",
    body: await request.text(),
  });
}
