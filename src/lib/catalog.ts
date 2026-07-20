import type { ChartSort, CreatorRank, Track } from "@/types";

export function formatNumber(n: number) {
  return new Intl.NumberFormat("fa-IR").format(n);
}

/** DB روی mock می‌نشیند؛ آثار واقعی اولویت دارند */
export function mergeCatalogTracks(dbTracks: Track[], mockTracks: Track[] = []): Track[] {
  const map = new Map<string, Track>();
  for (const t of mockTracks) map.set(t.id, t);
  for (const t of dbTracks) map.set(t.id, t);
  return [...map.values()];
}

export function sortTracks(list: Track[], sort: ChartSort) {
  return [...list].sort((a, b) => {
    let diff = 0;
    if (sort === "popular") diff = b.plays - a.plays;
    else if (sort === "visual") {
      diff = (b.ratings.visual ?? 0) - (a.ratings.visual ?? 0);
    } else {
      diff = b.ratings[sort] - a.ratings[sort];
    }
    if (diff !== 0) return diff;
    return b.plays - a.plays;
  });
}

export function getPromotedFrom(list: Track[]) {
  return list.filter((t) => t.promoted && t.status === "approved");
}

export function getApprovedFrom(list: Track[]) {
  return list.filter((t) => t.status === "approved");
}

export function getTopCreatorsFrom(list: Track[]): CreatorRank[] {
  const approved = getApprovedFrom(list);
  const map = new Map<
    string,
    { id: string; name: string; avatar: string; bio?: string; sum: number; count: number }
  >();

  for (const t of approved) {
    const prev = map.get(t.artist.id);
    if (prev) {
      prev.sum += t.ratings.overall;
      prev.count += 1;
    } else {
      map.set(t.artist.id, {
        id: t.artist.id,
        name: t.artist.name,
        avatar: t.artist.avatar,
        bio: t.artist.bio,
        sum: t.ratings.overall,
        count: 1,
      });
    }
  }

  return [...map.values()]
    .map((c) => {
      const avg = c.count ? c.sum / c.count : 0;
      return {
        id: c.id,
        name: c.name,
        avatar: c.avatar,
        bio: c.bio,
        metricLabel: "میانگین امتیاز",
        metricValue: avg.toFixed(1),
        score: avg || c.count,
      };
    })
    .sort((a, b) => b.score - a.score || b.metricValue.localeCompare(a.metricValue));
}

export function getTopLyricistsFrom(list: Track[]): CreatorRank[] {
  const approved = getApprovedFrom(list);
  const map = new Map<string, { name: string; avatar: string; sum: number; count: number }>();

  for (const t of approved) {
    if (!t.lyricist || t.lyricist === "—") continue;
    const prev = map.get(t.lyricist);
    if (prev) {
      prev.sum += t.ratings.lyrics;
      prev.count += 1;
    } else {
      map.set(t.lyricist, {
        name: t.lyricist,
        avatar: t.artist.avatar,
        sum: t.ratings.lyrics,
        count: 1,
      });
    }
  }

  return [...map.entries()]
    .map(([id, c]) => {
      const avg = c.count ? c.sum / c.count : 0;
      return {
        id,
        name: c.name,
        avatar: c.avatar,
        metricLabel: "میانگین شعر",
        metricValue: avg.toFixed(1),
        score: avg || c.count,
      };
    })
    .sort((a, b) => b.score - a.score);
}
