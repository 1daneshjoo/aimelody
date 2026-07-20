import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth";
import { formatDbError, query } from "@/lib/db";
import {
  mapAdminTrack,
  TRACK_FROM_JOIN,
  TRACK_SELECT,
  type TrackRow,
} from "@/lib/tracks";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "دسترسی مدیریت لازم است" }, { status: 403 });
    }

    const status = req.nextUrl.searchParams.get("status");
    let sql = `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN}`;
    const params: Record<string, string> = {};

    if (status === "pending" || status === "approved" || status === "rejected") {
      sql += ` WHERE t.status = :status`;
      params.status = status;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT 200`;

    const rows = await query<TrackRow[]>(sql, params);

    return NextResponse.json({
      ok: true,
      tracks: rows.map(mapAdminTrack),
    });
  } catch (e) {
    console.error("[admin/tracks GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
