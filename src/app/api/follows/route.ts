import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readSession } from "@/lib/auth";
import { execute, formatDbError, query } from "@/lib/db";
import { resolveArtistUserId } from "@/lib/social";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const body = (await req.json()) as { artistId?: string };
    const artistId = (body.artistId || "").trim();
    if (!artistId) {
      return NextResponse.json({ ok: false, error: "شناسه هنرمند نامعتبر است" }, { status: 400 });
    }

    const artist = await resolveArtistUserId(artistId);
    if (!artist) {
      return NextResponse.json({ ok: false, error: "هنرمند یافت نشد" }, { status: 404 });
    }

    if (artist.userId === session.id) {
      return NextResponse.json(
        { ok: false, error: "نمی‌توانید خودتان را دنبال کنید" },
        { status: 400 },
      );
    }

    type R = RowDataPacket & { c: number };
    const existing = await query<R[]>(
      `SELECT COUNT(*) AS c FROM follows
       WHERE follower_id = :followerId AND artist_user_id = :artistId`,
      { followerId: session.id, artistId: artist.userId },
    );
    const wasFollowing = Number(existing[0]?.c || 0) > 0;

    if (wasFollowing) {
      await execute(
        `DELETE FROM follows
         WHERE follower_id = :followerId AND artist_user_id = :artistId`,
        { followerId: session.id, artistId: artist.userId },
      );
      return NextResponse.json({
        ok: true,
        following: false,
        artistId: artist.publicId,
      });
    }

    await execute(
      `INSERT INTO follows (follower_id, artist_user_id)
       VALUES (:followerId, :artistId)`,
      { followerId: session.id, artistId: artist.userId },
    );

    return NextResponse.json({
      ok: true,
      following: true,
      artistId: artist.publicId,
    });
  } catch (e) {
    console.error("[follows POST]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
