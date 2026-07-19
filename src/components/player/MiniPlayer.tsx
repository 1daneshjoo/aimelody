"use client";

import Link from "next/link";
import { Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { usePlayer } from "@/components/player/PlayerProvider";

export function MiniPlayer() {
  const { current, playing, progress, toggle, next, prev, seek, stop } = usePlayer();
  if (!current) return null;

  return (
    <div className="fixed inset-x-0 bottom-[3.75rem] z-40 border-t border-line bg-[color-mix(in_oklab,var(--bg-elevated)_94%,transparent)] backdrop-blur-xl md:bottom-0">
      <div className="progress-bar !h-1 !rounded-none">
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="container-page flex items-center gap-3 py-2.5">
        <Link href={`/track/${current.id}`} className="flex min-w-0 flex-1 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.cover}
            alt=""
            className="size-12 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold">{current.title}</p>
            <p className="truncate text-xs text-muted">{current.artist.name}</p>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-ghost !px-2 !py-2" onClick={prev} aria-label="قبلی">
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            className="btn btn-primary !px-3 !py-2"
            onClick={toggle}
            disabled={current.type === "video"}
            aria-label={playing ? "توقف" : "پخش"}
            title={current.type === "video" ? "ویدئو را در صفحه اثر ببینید" : undefined}
          >
            {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          </button>
          <button type="button" className="btn btn-ghost !px-2 !py-2" onClick={next} aria-label="بعدی">
            <SkipForward size={16} />
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => seek(Number(e.target.value))}
          className="hidden w-36 sm:block"
          aria-label="پیشرفت پخش"
          disabled={current.type === "video"}
        />

        <button type="button" className="btn btn-ghost !px-2 !py-2" onClick={stop} aria-label="بستن">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
