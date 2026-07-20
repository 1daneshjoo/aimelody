import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readSession } from "@/lib/auth";
import { formatDbError, query } from "@/lib/db";
import { artistPublicIdFromUser } from "@/lib/tracks";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    type FavRow = RowDataPacket & { public_id: string };
    const favRows = await query<FavRow[]>(
      `SELECT t.public_id
       FROM favorites f
       JOIN tracks t ON t.id = f.track_id
       WHERE f.user_id = :userId
       ORDER BY f.created_at DESC`,
      { userId: session.id },
    );

    type FollowRow = RowDataPacket & {
      id: number;
      public_id: string | null;
    };
    const followRows = await query<FollowRow[]>(
      `SELECT u.id, u.public_id
       FROM follows f
       JOIN users u ON u.id = f.artist_user_id
       WHERE f.follower_id = :userId
       ORDER BY f.created_at DESC`,
      { userId: session.id },
    );

    return NextResponse.json({
      ok: true,
      favoriteIds: favRows.map((r) => r.public_id),
      followingIds: followRows.map((r) => artistPublicIdFromUser(r.id, r.public_id)),
    });
  } catch (e) {
    console.error("[me/library GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
