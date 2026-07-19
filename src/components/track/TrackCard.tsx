"use client";

import Link from "next/link";
import { Heart, Pause, Play } from "lucide-react";
import type { Track } from "@/types";
import { formatNumber, getApprovedTracks } from "@/data/mock";
import { useLibrary } from "@/components/library/LibraryProvider";
import { usePlayer } from "@/components/player/PlayerProvider";
import { COVER_THUMB_SIZE, coverThumbUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function TrackCard({
  track,
  compact = false,
  queue,
}: {
  track: Track;
  compact?: boolean;
  queue?: Track[];
}) {
  const src = coverThumbUrl(track.cover, COVER_THUMB_SIZE);
  const { playTrack, current, playing, toggle } = usePlayer();
  const { isFavorite, toggleFavorite } = useLibrary();
  const active = current?.id === track.id;
  const fav = isFavorite(track.id);

  const onPlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (active && track.type === "audio") {
      toggle();
      return;
    }
    const q = queue?.length ? queue : getApprovedTracks();
    playTrack(track, q);
  };

  const onFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(track.id);
  };

  return (
    <div className={cn("group flex h-full w-full min-w-0 flex-col", compact && "h-full")}>
      <div className="track-thumb" style={{ aspectRatio: "1 / 1" }}>
        <Link href={`/track/${track.id}`} className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={track.title}
            width={COVER_THUMB_SIZE}
            height={COVER_THUMB_SIZE}
            sizes={compact ? "196px" : "(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 280px"}
            loading="lazy"
            decoding="async"
            className="track-cover"
          />
        </Link>

        <button
          type="button"
          onClick={onPlay}
          className="absolute inset-0 z-[1] flex items-center justify-center bg-black/35 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
          aria-label={active && playing ? "توقف" : "پخش"}
        >
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-[#1a1008] shadow-lg">
            {active && playing && track.type === "audio" ? (
              <Pause size={20} />
            ) : (
              <Play size={20} fill="currentColor" />
            )}
          </span>
        </button>

        <button
          type="button"
          onClick={onFav}
          className={cn(
            "absolute top-2 left-2 z-[2] rounded-full bg-black/45 p-1.5 text-white",
            fav && "text-accent",
          )}
          aria-label={fav ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
        >
          <Heart size={14} fill={fav ? "currentColor" : "none"} />
        </button>

        {track.type === "video" && (
          <span className="badge absolute top-2 right-2 z-[2] bg-black/50 text-white">ویدئو</span>
        )}
        {track.promoted && (
          <span
            className={cn(
              "badge absolute z-[2] bg-black/50 text-white",
              track.type === "video" ? "bottom-2 right-2" : "top-2 right-2",
            )}
          >
            پروموت
          </span>
        )}
        <span className="absolute bottom-2 left-2 z-[2] rounded-md bg-black/55 px-2 py-0.5 text-xs text-white">
          {track.duration}
        </span>
      </div>

      <div className={cn("mt-3 flex flex-1 flex-col space-y-1", compact && "min-h-[3.25rem]")}>
        <Link href={`/track/${track.id}`} className="line-clamp-1 font-bold hover:text-accent">
          {track.title}
        </Link>
        <Link
          href={`/artist/${track.artist.id}`}
          className="line-clamp-1 text-sm text-muted hover:text-accent"
        >
          {track.artist.name}
        </Link>
        {!compact && (
          <div className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs text-muted">
            <span className="truncate">
              امتیاز {track.ratings.overall.toFixed(1)} · {formatNumber(track.plays)} پخش
            </span>
            <span className="inline-flex shrink-0 items-center gap-1">
              <Heart size={12} className={fav ? "text-accent" : undefined} />{" "}
              {formatNumber(track.favorites + (fav ? 1 : 0))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
