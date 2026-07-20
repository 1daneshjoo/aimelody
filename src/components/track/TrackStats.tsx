"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { useLibrary } from "@/components/library/LibraryProvider";
import { formatNumber } from "@/lib/catalog";

export function TrackStats({
  trackId,
  plays: initialPlays,
  favorites: initialFavorites,
  createdAt,
}: {
  trackId: string;
  plays: number;
  favorites: number;
  createdAt: string;
}) {
  const { isFavorite, toggleFavorite, favoriteCountDelta } = useLibrary();
  const [plays, setPlays] = useState(initialPlays);
  const [favoritesCount, setFavoritesCount] = useState(initialFavorites);
  const fav = isFavorite(trackId);

  useEffect(() => {
    const onPlays = (e: Event) => {
      const detail = (e as CustomEvent<{ trackId: string; plays: number }>).detail;
      if (detail?.trackId === trackId) setPlays(detail.plays);
    };
    const onFav = (e: Event) => {
      const detail = (e as CustomEvent<{ trackId: string; favoritesCount: number }>).detail;
      if (detail?.trackId === trackId) setFavoritesCount(detail.favoritesCount);
    };
    window.addEventListener("aimelody:plays", onPlays);
    window.addEventListener("aimelody:favorites", onFav);
    return () => {
      window.removeEventListener("aimelody:plays", onPlays);
      window.removeEventListener("aimelody:favorites", onFav);
    };
  }, [trackId]);

  const displayFavorites = Math.max(0, favoritesCount + favoriteCountDelta(trackId));

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
      <span>{formatNumber(plays)} پخش</span>
      <span>·</span>
      <button
        type="button"
        onClick={() => toggleFavorite(trackId)}
        className="inline-flex items-center gap-1 hover:text-accent"
        aria-label={fav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
      >
        <Heart size={14} className={fav ? "text-accent" : undefined} fill={fav ? "currentColor" : "none"} />
        {formatNumber(displayFavorites)} علاقه‌مندی
      </button>
      <span>·</span>
      <span>{createdAt}</span>
    </div>
  );
}
