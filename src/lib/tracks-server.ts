import type { RowDataPacket } from "mysql2";
import { execute, query } from "@/lib/db";
import {
  artistPublicIdFromUser,
  formatTrackDate,
  mapTrackToCatalog,
  TRACK_FROM_JOIN,
  TRACK_SELECT,
  type TrackRow,
} from "@/lib/tracks";
import type { AdBanner, Artist, Competition, Track, UserProfile } from "@/types";

export async function getTrackByPublicId(id: string): Promise<Track | null> {
  const rows = await query<TrackRow[]>(
    `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN} WHERE t.public_id = :id LIMIT 1`,
    { id },
  );
  const row = rows[0];
  return row ? mapTrackToCatalog(row) : null;
}

/** اثر برای بازدیدکننده — pending فقط برای ادمین یا مالک */
export async function getTrackForViewer(
  id: string,
  session: { id: number; role: "user" | "admin" } | null,
): Promise<{ track: Track; isOwner: boolean; isAdmin: boolean } | null> {
  const rows = await query<TrackRow[]>(
    `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN} WHERE t.public_id = :id LIMIT 1`,
    { id },
  );
  const row = rows[0];
  if (!row) return null;

  const isAdmin = session?.role === "admin";
  const isOwner = session?.id === row.user_id;
  if (row.status !== "approved" && !isAdmin && !isOwner) return null;

  return {
    track: mapTrackToCatalog(row),
    isOwner,
    isAdmin,
  };
}

export async function getApprovedTracksFromDb(): Promise<Track[]> {
  const rows = await query<TrackRow[]>(
    `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN}
     WHERE t.status = 'approved'
     ORDER BY t.created_at DESC
     LIMIT 200`,
  );
  return rows.map(mapTrackToCatalog);
}

type UserRow = RowDataPacket & {
  id: number;
  public_id: string | null;
  phone: string;
  name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "user" | "admin";
  created_at: Date;
};

export async function getArtistByParam(id: string): Promise<(Artist & { userId: number }) | null> {
  const numeric = /^\d+$/.test(id) ? Number(id) : null;
  const rows = await query<UserRow[]>(
    `SELECT id, public_id, phone, name, avatar_url, bio, role, created_at
     FROM users
     WHERE public_id = :id
        OR CONCAT('a', id) = :id
        OR (:numericId IS NOT NULL AND id = :numericId)
     LIMIT 1`,
    { id, numericId: numeric },
  );
  const row = rows[0];
  if (!row) return null;
  return {
    userId: row.id,
    id: artistPublicIdFromUser(row.id, row.public_id),
    name: row.name?.trim() || `کاربر ${row.phone.slice(-4)}`,
    avatar: row.avatar_url || "/images/avatars/a1.jpg",
    bio: row.bio || undefined,
  };
}

export async function getApprovedTracksByArtistUserId(userId: number): Promise<Track[]> {
  const rows = await query<TrackRow[]>(
    `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN}
     WHERE t.status = 'approved' AND t.user_id = :userId
     ORDER BY t.created_at DESC`,
    { userId },
  );
  return rows.map(mapTrackToCatalog);
}

export async function ensureUserPublicId(userId: number) {
  await execute(
    `UPDATE users SET public_id = CONCAT('a', id)
     WHERE id = :userId AND (public_id IS NULL OR public_id = '')`,
    { userId },
  );
}

export async function getCompetitionsFromDb(): Promise<Competition[]> {
  type CompRow = RowDataPacket & {
    id: number;
    title: string;
    description: string | null;
    cover_url: string | null;
    deadline: Date | string | null;
    status: Competition["status"];
    prize: string | null;
    entries_count: number;
  };

  if (!(await tableExists("competitions"))) return [];

  const rows = await query<CompRow[]>(
    `SELECT c.*,
       (SELECT COUNT(*) FROM tracks t WHERE t.competition_id = c.id AND t.status = 'approved') AS entries_count
     FROM competitions c
     ORDER BY FIELD(c.status, 'active', 'upcoming', 'ended'), c.deadline IS NULL, c.deadline DESC`,
  );

  return rows.map((c) => ({
    id: String(c.id),
    title: c.title,
    description: c.description || "",
    cover: c.cover_url || "/images/covers/c1.jpg",
    deadline: c.deadline
      ? formatTrackDate(c.deadline)
      : "—",
    status: c.status,
    entriesCount: Number(c.entries_count || 0),
    prize: c.prize || "—",
  }));
}

export async function getAdsFromDb(): Promise<AdBanner[]> {
  type AdRow = RowDataPacket & {
    public_id: string;
    title: string;
    image_url: string;
    href: string;
    placement: AdBanner["placement"];
  };

  if (!(await tableExists("ads"))) return [];

  const rows = await query<AdRow[]>(
    `SELECT public_id, title, image_url, href, placement
     FROM ads WHERE active = 1 ORDER BY id ASC`,
  );

  return rows.map((a) => ({
    id: a.public_id,
    title: a.title,
    image: a.image_url,
    href: a.href,
    placement: a.placement,
  }));
}

export async function getGenresFromDb(): Promise<string[]> {
  if (!(await tableExists("genres"))) return [];
  type G = RowDataPacket & { name: string };
  const rows = await query<G[]>(
    `SELECT name FROM genres ORDER BY sort_order ASC, name ASC`,
  );
  return rows.map((g) => g.name);
}

export async function getAdminUsersFromDb(): Promise<UserProfile[]> {
  const rows = await query<UserRow[]>(
    `SELECT id, public_id, phone, name, avatar_url, bio, role, created_at
     FROM users ORDER BY created_at DESC LIMIT 200`,
  );
  return rows.map((u) => ({
    id: artistPublicIdFromUser(u.id, u.public_id),
    name: u.name?.trim() || `کاربر ${u.phone.slice(-4)}`,
    phone: u.phone,
    role: u.role,
    avatar: u.avatar_url || "/images/avatars/a1.jpg",
    bio: u.bio || "",
    joinedAt: formatTrackDate(u.created_at),
  }));
}

async function tableExists(table: string) {
  type R = RowDataPacket & { c: number };
  const rows = await query<R[]>(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table`,
    { table },
  );
  return Number(rows[0]?.c || 0) > 0;
}
