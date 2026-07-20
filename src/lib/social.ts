import type { RowDataPacket } from "mysql2";
import type { Comment, RatingAverages } from "@/types";
import { query } from "@/lib/db";
import { artistPublicIdFromUser, formatTrackDate } from "@/lib/tracks";

export type TrackRef = RowDataPacket & {
  id: number;
  public_id: string;
  user_id: number;
  type: "audio" | "video";
  status: "pending" | "approved" | "rejected";
  plays: number;
  favorites_count: number;
};

export async function resolveTrackByPublicId(publicId: string): Promise<TrackRef | null> {
  const rows = await query<TrackRef[]>(
    `SELECT id, public_id, user_id, type, status, plays, favorites_count
     FROM tracks WHERE public_id = :id LIMIT 1`,
    { id: publicId },
  );
  return rows[0] ?? null;
}

export async function resolveArtistUserId(artistParam: string): Promise<{
  userId: number;
  publicId: string;
} | null> {
  type UserRow = RowDataPacket & {
    id: number;
    public_id: string | null;
  };
  const numeric = /^\d+$/.test(artistParam) ? Number(artistParam) : null;
  const rows = await query<UserRow[]>(
    `SELECT id, public_id FROM users
     WHERE public_id = :id
        OR CONCAT('a', id) = :id
        OR (:numericId IS NOT NULL AND id = :numericId)
     LIMIT 1`,
    { id: artistParam, numericId: numeric },
  );
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.id,
    publicId: artistPublicIdFromUser(row.id, row.public_id),
  };
}

export function clampScore(n: unknown): number | null {
  if (n == null || n === "") return null;
  const v = Number(n);
  if (!Number.isFinite(v)) return null;
  const rounded = Math.round(v);
  if (rounded < 1 || rounded > 10) return null;
  return rounded;
}

export async function getRatingAverages(trackId: number): Promise<RatingAverages> {
  type AvgRow = RowDataPacket & {
    avg_lyrics: number | string | null;
    avg_melody: number | string | null;
    avg_vocals: number | string | null;
    avg_visual: number | string | null;
    avg_overall: number | string | null;
    ratings_count: number | string | null;
  };
  const rows = await query<AvgRow[]>(
    `SELECT
       AVG(lyrics) AS avg_lyrics,
       AVG(melody) AS avg_melody,
       AVG(vocals) AS avg_vocals,
       AVG(visual) AS avg_visual,
       AVG(overall) AS avg_overall,
       COUNT(*) AS ratings_count
     FROM ratings WHERE track_id = :trackId`,
    { trackId },
  );
  const row = rows[0];
  const num = (v: number | string | null | undefined) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };
  const count = Math.round(num(row?.ratings_count));
  return {
    lyrics: Number(num(row?.avg_lyrics).toFixed(1)),
    melody: Number(num(row?.avg_melody).toFixed(1)),
    vocals: Number(num(row?.avg_vocals).toFixed(1)),
    visual: row?.avg_visual != null ? Number(num(row.avg_visual).toFixed(1)) : undefined,
    overall: Number(num(row?.avg_overall).toFixed(1)),
    count,
  };
}

type CommentRow = RowDataPacket & {
  id: number;
  body: string;
  created_at: Date;
  track_public_id: string;
  user_name: string | null;
  avatar_url: string | null;
  phone: string;
};

export function mapCommentRow(row: CommentRow): Comment {
  const name =
    row.user_name?.trim() ||
    (row.phone.length >= 4 ? `کاربر ${row.phone.slice(-4)}` : "کاربر");
  return {
    id: String(row.id),
    trackId: row.track_public_id,
    userName: name,
    avatar: row.avatar_url || "/images/avatars/a1.jpg",
    body: row.body,
    createdAt: formatTrackDate(row.created_at),
  };
}

export async function getCommentsForTrackPublicId(publicId: string): Promise<Comment[]> {
  const rows = await query<CommentRow[]>(
    `SELECT c.id, c.body, c.created_at,
            t.public_id AS track_public_id,
            u.name AS user_name, u.avatar_url, u.phone
     FROM comments c
     JOIN tracks t ON t.id = c.track_id
     JOIN users u ON u.id = c.user_id
     WHERE t.public_id = :id AND t.status = 'approved'
     ORDER BY c.created_at DESC
     LIMIT 200`,
    { id: publicId },
  );
  return rows.map(mapCommentRow);
}
