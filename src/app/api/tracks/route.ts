import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { readSession } from "@/lib/auth";
import { execute, formatDbError, query } from "@/lib/db";
import { createTrackPublicId, mapTrackRow, type TrackRow } from "@/lib/tracks";
import { embedAudioMetadata } from "@/lib/audio-metadata";

export const runtime = "nodejs";

const VOCAL_SOURCES = new Set(["ai", "own", "licensed", "other"]);

export async function GET(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const rows = await query<TrackRow[]>(
      `SELECT id, public_id, user_id, title, type, cover_url, media_url, storage_path,
              genre, language, lyricist, vocal_owner, vocal_source, composer, lyrics,
              ai_tools, prompt, description, competition_id, duration_label, status,
              promoted, plays, favorites_count, created_at, updated_at
       FROM tracks
       WHERE user_id = :userId
       ORDER BY created_at DESC`,
      { userId: session.id },
    );

    return NextResponse.json({
      ok: true,
      tracks: rows.map(mapTrackRow),
    });
  } catch (e) {
    console.error("[tracks/GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const body = (await req.json()) as {
      title?: string;
      type?: string;
      genre?: string;
      language?: string;
      lyricist?: string;
      composer?: string;
      vocalOwner?: string;
      vocalSource?: string;
      lyrics?: string;
      aiTools?: string;
      prompt?: string;
      description?: string;
      competitionId?: string | number | null;
      mediaUrl?: string;
      coverUrl?: string;
      mediaStoragePath?: string;
    };

    const title = (body.title || "").trim();
    const type = body.type === "video" ? "video" : body.type === "audio" ? "audio" : "";
    const lyricist = (body.lyricist || "").trim();
    const vocalOwner = (body.vocalOwner || "").trim();
    const mediaUrl = (body.mediaUrl || "").trim();
    const coverUrl = (body.coverUrl || "").trim();
    const vocalSource = VOCAL_SOURCES.has(body.vocalSource || "")
      ? (body.vocalSource as "ai" | "own" | "licensed" | "other")
      : null;

    if (!title || !type || !lyricist || !vocalOwner || !mediaUrl || !coverUrl) {
      return NextResponse.json(
        { ok: false, error: "اطلاعات اثر ناقص است" },
        { status: 400 },
      );
    }

    let competitionId: number | null = null;
    if (body.competitionId !== undefined && body.competitionId !== null && body.competitionId !== "") {
      const parsed = Number(body.competitionId);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ ok: false, error: "شناسه مسابقه نامعتبر است" }, { status: 400 });
      }
      const competitions = await query<RowDataPacket[]>(
        `SELECT id FROM competitions WHERE id = :id LIMIT 1`,
        { id: parsed },
      );
      if (!competitions[0]) {
        return NextResponse.json({ ok: false, error: "مسابقه انتخاب‌شده یافت نشد" }, { status: 400 });
      }
      competitionId = parsed;
    }

    const publicId = createTrackPublicId();
    const result = await execute(
      `INSERT INTO tracks
        (public_id, user_id, title, type, cover_url, media_url, storage_path,
         genre, language, lyricist, vocal_owner, vocal_source, composer, lyrics,
         ai_tools, prompt, description, competition_id, status)
       VALUES
        (:publicId, :userId, :title, :type, :coverUrl, :mediaUrl, :storagePath,
         :genre, :language, :lyricist, :vocalOwner, :vocalSource, :composer, :lyrics,
         :aiTools, :prompt, :description, :competitionId, 'pending')`,
      {
        publicId,
        userId: session.id,
        title,
        type,
        coverUrl,
        mediaUrl,
        storagePath: (body.mediaStoragePath || "").trim() || null,
        genre: (body.genre || "").trim() || null,
        language: (body.language || "").trim() || null,
        lyricist,
        vocalOwner,
        vocalSource,
        composer: (body.composer || "").trim() || null,
        lyrics: (body.lyrics || "").trim() || null,
        aiTools: (body.aiTools || "").trim() || null,
        prompt: (body.prompt || "").trim() || null,
        description: (body.description || "").trim() || null,
        competitionId,
      },
    );

    const rows = await query<TrackRow[]>(
      `SELECT id, public_id, user_id, title, type, cover_url, media_url, storage_path,
              genre, language, lyricist, vocal_owner, vocal_source, composer, lyrics,
              ai_tools, prompt, description, competition_id, duration_label, status,
              promoted, plays, favorites_count, created_at, updated_at
       FROM tracks
       WHERE id = :id
       LIMIT 1`,
      { id: Number(result.insertId) },
    );

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "ثبت اثر ناموفق بود" }, { status: 500 });
    }

    if (type === "audio") {
      const artistName = session.name?.trim() || session.phone;
      void embedAudioMetadata({
        title,
        artistName,
        genre: (body.genre || "").trim() || null,
        language: (body.language || "").trim() || null,
        lyricist,
        lyrics: (body.lyrics || "").trim() || null,
        aiTools: (body.aiTools || "").trim() || null,
        description: (body.description || "").trim() || null,
        trackPublicId: publicId,
        mediaUrl,
        coverUrl,
        storagePath: (body.mediaStoragePath || "").trim() || null,
      }).catch((e) => console.warn("[tracks/POST] embed metadata", e));
    }

    return NextResponse.json({
      ok: true,
      track: mapTrackRow(row),
    });
  } catch (e) {
    console.error("[tracks/POST]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
