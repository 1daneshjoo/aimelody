import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { readSession } from "@/lib/auth";
import { formatDbError, getPool, query } from "@/lib/db";
import {
  getCommentsForTrackPublicId,
  mapCommentRow,
  resolveTrackByPublicId,
} from "@/lib/social";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const track = await resolveTrackByPublicId(id);
    if (!track || track.status !== "approved") {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    const comments = await getCommentsForTrackPublicId(id);
    return NextResponse.json({ ok: true, comments });
  } catch (e) {
    console.error("[comments GET]", e);
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

    const body = (await req.json()) as { body?: string };
    const text = (body.body || "").trim();
    if (text.length < 2 || text.length > 2000) {
      return NextResponse.json(
        { ok: false, error: "نظر باید بین ۲ تا ۲۰۰۰ کاراکتر باشد" },
        { status: 400 },
      );
    }

    const [result] = await getPool().execute<ResultSetHeader>(
      `INSERT INTO comments (track_id, user_id, body)
       VALUES (:trackId, :userId, :body)`,
      { trackId: track.id, userId: session.id, body: text },
    );

    type CommentRow = RowDataPacket & {
      id: number;
      body: string;
      created_at: Date;
      track_public_id: string;
      user_name: string | null;
      avatar_url: string | null;
      phone: string;
    };

    const rows = await query<CommentRow[]>(
      `SELECT c.id, c.body, c.created_at,
              t.public_id AS track_public_id,
              u.name AS user_name, u.avatar_url, u.phone
       FROM comments c
       JOIN tracks t ON t.id = c.track_id
       JOIN users u ON u.id = c.user_id
       WHERE c.id = :id LIMIT 1`,
      { id: result.insertId },
    );

    const comment = rows[0] ? mapCommentRow(rows[0]) : null;
    return NextResponse.json({ ok: true, comment });
  } catch (e) {
    console.error("[comments POST]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
