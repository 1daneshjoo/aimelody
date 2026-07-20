import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readSession } from "@/lib/auth";
import { formatDbError, query, withConnection } from "@/lib/db";
import { resolveTrackByPublicId } from "@/lib/social";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const session = await readSession(req);
    const { id } = await params;
    const track = await resolveTrackByPublicId(id);
    if (!track || track.status !== "approved") {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    let favorited = false;
    if (session) {
      type R = RowDataPacket & { c: number };
      const rows = await query<R[]>(
        `SELECT COUNT(*) AS c FROM favorites
         WHERE user_id = :userId AND track_id = :trackId`,
        { userId: session.id, trackId: track.id },
      );
      favorited = Number(rows[0]?.c || 0) > 0;
    }

    return NextResponse.json({
      ok: true,
      favorited,
      favoritesCount: track.favorites_count,
    });
  } catch (e) {
    console.error("[favorite GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Props) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const { id } = await params;
    const track = await resolveTrackByPublicId(id);
    if (!track || track.status !== "approved") {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    const result = await withConnection(async (conn) => {
      await conn.beginTransaction();
      try {
        const [existing] = await conn.query<RowDataPacket[]>(
          `SELECT 1 AS ok FROM favorites
           WHERE user_id = :userId AND track_id = :trackId LIMIT 1`,
          { userId: session.id, trackId: track.id },
        );

        let favorited: boolean;
        if (existing.length > 0) {
          await conn.execute(
            `DELETE FROM favorites WHERE user_id = :userId AND track_id = :trackId`,
            { userId: session.id, trackId: track.id },
          );
          await conn.execute(
            `UPDATE tracks SET favorites_count = GREATEST(favorites_count - 1, 0)
             WHERE id = :trackId`,
            { trackId: track.id },
          );
          favorited = false;
        } else {
          await conn.execute(
            `INSERT INTO favorites (user_id, track_id) VALUES (:userId, :trackId)`,
            { userId: session.id, trackId: track.id },
          );
          await conn.execute(
            `UPDATE tracks SET favorites_count = favorites_count + 1 WHERE id = :trackId`,
            { trackId: track.id },
          );
          favorited = true;
        }

        const [countRows] = await conn.query<RowDataPacket[]>(
          `SELECT favorites_count FROM tracks WHERE id = :trackId LIMIT 1`,
          { trackId: track.id },
        );
        await conn.commit();
        return {
          favorited,
          favoritesCount: Number(countRows[0]?.favorites_count ?? 0),
        };
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[favorite POST]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
