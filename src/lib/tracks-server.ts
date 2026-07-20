import { query } from "@/lib/db";
import {
  mapTrackToCatalog,
  TRACK_FROM_JOIN,
  TRACK_SELECT,
  type TrackRow,
} from "@/lib/tracks";
import type { Track } from "@/types";

export async function getTrackByPublicId(id: string): Promise<Track | null> {
  const rows = await query<TrackRow[]>(
    `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN} WHERE t.public_id = :id LIMIT 1`,
    { id },
  );
  const row = rows[0];
  return row ? mapTrackToCatalog(row) : null;
}

export async function getApprovedTracksFromDb(): Promise<Track[]> {
  const rows = await query<TrackRow[]>(
    `SELECT ${TRACK_SELECT} ${TRACK_FROM_JOIN} WHERE t.status = 'approved' ORDER BY t.created_at DESC LIMIT 100`,
  );
  return rows.map(mapTrackToCatalog);
}
