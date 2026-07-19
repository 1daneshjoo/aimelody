import Link from "next/link";
import { Heart, Play } from "lucide-react";
import type { Track } from "@/types";
import { formatNumber } from "@/data/mock";
import { cn } from "@/lib/utils";

export function TrackCard({
  track,
  compact = false,
}: {
  track: Track;
  compact?: boolean;
}) {
  const isVideo = track.type === "video";

  return (
    <Link
      href={`/track/${track.id}`}
      className={cn("group block", compact ? "min-w-[160px]" : "")}
    >
      <div
        className={cn(
          "relative overflow-hidden bg-bg-elevated",
          isVideo ? "aspect-video rounded-xl" : "aspect-square rounded-2xl",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.cover}
          alt={track.title}
          className="track-cover h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition group-hover:opacity-100">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-[#1a1008]">
            <Play size={20} fill="currentColor" />
          </span>
        </div>
        {track.promoted && (
          <span className="badge absolute top-2 right-2 bg-black/50">پروموت</span>
        )}
        <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-xs">
          {track.duration}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="line-clamp-1 font-bold">{track.title}</h3>
        <p className="text-sm text-muted">{track.artist.name}</p>
        {!compact && (
          <div className="flex items-center justify-between text-xs text-muted">
            <span>
              امتیاز {track.ratings.overall.toFixed(1)} · {formatNumber(track.plays)} پخش
            </span>
            <span className="inline-flex items-center gap-1">
              <Heart size={12} /> {formatNumber(track.favorites)}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
