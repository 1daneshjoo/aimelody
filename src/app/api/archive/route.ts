import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { formatDbError, query } from "@/lib/db";
import { mapTrackToCatalog, TRACK_FROM_JOIN, TRACK_SELECT, type TrackRow } from "@/lib/tracks";

export const runtime = "nodejs";

/** آرشیو عمومی — فقط آثار تاییدشده */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const genre = searchParams.get("genre");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();

    let sql = `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN} WHERE t.status = 'approved'`;
    const params: Record<string, string> = {};

    if (genre && genre !== "همه") {
      sql += ` AND t.genre = :genre`;
      params.genre = genre;
    }
    if (type === "audio" || type === "video") {
      sql += ` AND t.type = :type`;
      params.type = type;
    }
    if (q) {
      sql += ` AND (t.title LIKE :q OR u.name LIKE :q OR t.genre LIKE :q)`;
      params.q = `%${q}%`;
    }

    sql += ` ORDER BY t.created_at DESC LIMIT 100`;

    const rows = await query<TrackRow[]>(sql, params);

    return NextResponse.json({
      ok: true,
      tracks: rows.map(mapTrackToCatalog),
    });
  } catch (e) {
    console.error("[archive/GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error, tracks: [] }, { status: 500 });
  }
}
