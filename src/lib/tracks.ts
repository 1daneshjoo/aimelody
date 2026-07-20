import { randomBytes } from "crypto";
import type { RowDataPacket } from "mysql2";
import type { ApprovalStatus, Artist, MediaType, Track, VocalSource } from "@/types";

export type TrackRow = RowDataPacket & {
  id: number;
  public_id: string;
  user_id: number;
  title: string;
  type: MediaType;
  cover_url: string | null;
  media_url: string;
  storage_path: string | null;
  genre: string | null;
  language: string | null;
  lyricist: string | null;
  vocal_owner: string | null;
  vocal_source: VocalSource | null;
  composer: string | null;
  lyrics: string | null;
  ai_tools: string | null;
  prompt: string | null;
  description: string | null;
  competition_id: number | null;
  duration_label: string | null;
  status: ApprovalStatus;
  promoted: number;
  plays: number;
  favorites_count: number;
  created_at: Date;
  updated_at: Date;
  artist_name?: string | null;
  artist_avatar?: string | null;
  artist_bio?: string | null;
  artist_public_id?: string | null;
  avg_lyrics?: number | string | null;
  avg_melody?: number | string | null;
  avg_vocals?: number | string | null;
  avg_visual?: number | string | null;
  avg_overall?: number | string | null;
  ratings_count?: number | string | null;
};

export type MyTrack = {
  id: string;
  title: string;
  type: MediaType;
  cover: string;
  mediaUrl: string;
  genre: string;
  status: ApprovalStatus;
  createdAt: string;
};

export type AdminTrack = MyTrack & {
  artistName: string;
  artistAvatar: string;
};

export const TRACK_SELECT = `t.id, t.public_id, t.user_id, t.title, t.type, t.cover_url, t.media_url,
  t.storage_path, t.genre, t.language, t.lyricist, t.vocal_owner, t.vocal_source, t.composer,
  t.lyrics, t.ai_tools, t.prompt, t.description, t.competition_id, t.duration_label, t.status,
  t.promoted, t.plays, t.favorites_count, t.created_at, t.updated_at,
  u.name AS artist_name, u.avatar_url AS artist_avatar, u.bio AS artist_bio,
  u.public_id AS artist_public_id,
  rt.avg_lyrics, rt.avg_melody, rt.avg_vocals, rt.avg_visual, rt.avg_overall, rt.ratings_count`;

export const TRACK_FROM_JOIN = `FROM tracks t
  JOIN users u ON u.id = t.user_id
  LEFT JOIN (
    SELECT track_id,
      AVG(lyrics) AS avg_lyrics,
      AVG(melody) AS avg_melody,
      AVG(vocals) AS avg_vocals,
      AVG(visual) AS avg_visual,
      AVG(overall) AS avg_overall,
      COUNT(*) AS ratings_count
    FROM ratings
    GROUP BY track_id
  ) rt ON rt.track_id = t.id`;

export function createTrackPublicId() {
  return randomBytes(12).toString("hex");
}

export function artistPublicIdFromUser(userId: number, publicId?: string | null) {
  if (publicId?.trim()) return publicId.trim();
  return `a${userId}`;
}

export function formatTrackDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function num(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function mapTrackRow(row: TrackRow): MyTrack {
  return {
    id: row.public_id,
    title: row.title,
    type: row.type,
    cover: row.cover_url || "/images/covers/c1.jpg",
    mediaUrl: row.media_url,
    genre: row.genre || "—",
    status: row.status,
    createdAt: formatTrackDate(row.created_at),
  };
}

export function mapAdminTrack(row: TrackRow): AdminTrack {
  return {
    ...mapTrackRow(row),
    artistName: row.artist_name?.trim() || "کاربر",
    artistAvatar: row.artist_avatar || "/images/avatars/a1.jpg",
  };
}

export function mapArtistFromTrackRow(row: TrackRow): Artist {
  return {
    id: artistPublicIdFromUser(row.user_id, row.artist_public_id),
    name: row.artist_name?.trim() || "کاربر",
    avatar: row.artist_avatar || "/images/avatars/a1.jpg",
    bio: row.artist_bio || undefined,
  };
}

export function mapTrackToCatalog(row: TrackRow): Track {
  const count = Math.round(num(row.ratings_count));
  return {
    id: row.public_id,
    title: row.title,
    type: row.type,
    cover: row.cover_url || "/images/covers/c1.jpg",
    mediaUrl: row.media_url,
    artist: mapArtistFromTrackRow(row),
    lyricist: row.lyricist || "—",
    vocalOwner: row.vocal_owner || "—",
    vocalSource: row.vocal_source || "ai",
    composer: row.composer || undefined,
    genre: row.genre || "—",
    language: row.language || undefined,
    lyrics: row.lyrics || undefined,
    aiTools: row.ai_tools
      ? row.ai_tools.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    prompt: row.prompt || undefined,
    description: row.description || undefined,
    duration: row.duration_label || "—",
    plays: row.plays,
    favorites: row.favorites_count,
    promoted: Boolean(row.promoted),
    competitionId: row.competition_id ? String(row.competition_id) : undefined,
    createdAt: formatTrackDate(row.created_at),
    ratings: {
      lyrics: Number(num(row.avg_lyrics).toFixed(1)),
      melody: Number(num(row.avg_melody).toFixed(1)),
      vocals: Number(num(row.avg_vocals).toFixed(1)),
      visual: row.avg_visual != null ? Number(num(row.avg_visual).toFixed(1)) : undefined,
      overall: Number(num(row.avg_overall).toFixed(1)),
      count,
    },
    status: row.status,
  };
}
