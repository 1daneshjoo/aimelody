import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { execute, formatDbError } from "@/lib/db";
import { resolveTrackByPublicId } from "@/lib/social";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const track = await resolveTrackByPublicId(id);
    if (!track || track.status !== "approved") {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    await execute(`UPDATE tracks SET plays = plays + 1 WHERE id = :id`, { id: track.id });
    const plays = track.plays + 1;

    return NextResponse.json({ ok: true, plays });
  } catch (e) {
    console.error("[play POST]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
