import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth";
import { formatDbError, query } from "@/lib/db";
import {
  mapTrackToCatalog,
  TRACK_FROM_JOIN,
  TRACK_SELECT,
  type TrackRow,
} from "@/lib/tracks";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const rows = await query<TrackRow[]>(
      `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN} WHERE t.public_id = :id LIMIT 1`,
      { id },
    );
    const row = rows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    const session = await readSession(_req);
    const isOwner = session?.id === row.user_id;
    const isAdmin = session?.role === "admin";

    if (row.status !== "approved" && !isOwner && !isAdmin) {
      return NextResponse.json({ ok: false, error: "دسترسی مجاز نیست" }, { status: 403 });
    }

    return NextResponse.json({
      ok: true,
      track: mapTrackToCatalog(row),
    });
  } catch (e) {
    console.error("[tracks/id GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
