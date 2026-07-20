import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readSession } from "@/lib/auth";
import { execute, formatDbError, query } from "@/lib/db";
import {
  clampScore,
  getRatingAverages,
  resolveTrackByPublicId,
} from "@/lib/social";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const track = await resolveTrackByPublicId(id);
    if (!track || track.status !== "approved") {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    const averages = await getRatingAverages(track.id);
    const session = await readSession(req);
    let mine: {
      lyrics: number;
      melody: number;
      vocals: number;
      visual: number | null;
      overall: number;
    } | null = null;

    if (session) {
      type RatingRow = RowDataPacket & {
        lyrics: number;
        melody: number;
        vocals: number;
        visual: number | null;
        overall: number;
      };
      const rows = await query<RatingRow[]>(
        `SELECT lyrics, melody, vocals, visual, overall
         FROM ratings WHERE track_id = :trackId AND user_id = :userId LIMIT 1`,
        { trackId: track.id, userId: session.id },
      );
      const row = rows[0];
      if (row) {
        mine = {
          lyrics: row.lyrics,
          melody: row.melody,
          vocals: row.vocals,
          visual: row.visual,
          overall: row.overall,
        };
      }
    }

    return NextResponse.json({ ok: true, averages, mine });
  } catch (e) {
    console.error("[ratings GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}

async function upsertRating(req: NextRequest, { params }: Props) {
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

    const body = (await req.json()) as Record<string, unknown>;
    const lyrics = clampScore(body.lyrics);
    const melody = clampScore(body.melody);
    const vocals = clampScore(body.vocals);
    const overall = clampScore(body.overall);
    const visualRaw = body.visual;

    if (lyrics == null || melody == null || vocals == null || overall == null) {
      return NextResponse.json(
        { ok: false, error: "امتیازها باید بین ۱ تا ۱۰ باشند" },
        { status: 400 },
      );
    }

    let visual: number | null = null;
    if (track.type === "video") {
      visual = clampScore(visualRaw);
      if (visual == null) {
        return NextResponse.json(
          { ok: false, error: "امتیاز بصری برای ویدئو الزامی است" },
          { status: 400 },
        );
      }
    }

    await execute(
      `INSERT INTO ratings (track_id, user_id, lyrics, melody, vocals, visual, overall)
       VALUES (:trackId, :userId, :lyrics, :melody, :vocals, :visual, :overall)
       ON DUPLICATE KEY UPDATE
         lyrics = VALUES(lyrics),
         melody = VALUES(melody),
         vocals = VALUES(vocals),
         visual = VALUES(visual),
         overall = VALUES(overall)`,
      {
        trackId: track.id,
        userId: session.id,
        lyrics,
        melody,
        vocals,
        visual,
        overall,
      },
    );

    const averages = await getRatingAverages(track.id);
    return NextResponse.json({
      ok: true,
      averages,
      mine: { lyrics, melody, vocals, visual, overall },
    });
  } catch (e) {
    console.error("[ratings upsert]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: Props) {
  return upsertRating(req, ctx);
}

export async function PUT(req: NextRequest, ctx: Props) {
  return upsertRating(req, ctx);
}
