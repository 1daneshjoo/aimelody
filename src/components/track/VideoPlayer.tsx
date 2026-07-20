"use client";

import type { Track } from "@/types";
import { recordPlayOnce } from "@/lib/record-play";

export function VideoPlayer({ track }: { track: Track }) {
  return (
    <div className="surface overflow-hidden">
      <div className="relative aspect-video bg-black">
        <video
          className="h-full w-full"
          controls
          poster={track.cover}
          preload="metadata"
          src={track.mediaUrl}
          onPlay={() => recordPlayOnce(track.id)}
        />
        <div className="pointer-events-none absolute top-3 right-3 rounded-md bg-black/60 px-2 py-1 text-xs">
          پیش‌نمایش اسپانسر · Pre-roll دمو
        </div>
      </div>
      <div className="p-5 md:p-6">
        <p className="badge mb-3">فایل ویدئویی</p>
        <h1 className="font-display text-2xl font-bold md:text-3xl">{track.title}</h1>
        <p className="mt-2 text-muted">
          {track.artist.name} · {track.genre} · {track.duration}
        </p>
      </div>
    </div>
  );
}
