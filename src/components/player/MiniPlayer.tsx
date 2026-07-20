"use client";

import Link from "next/link";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { formatPlayerTime, usePlayer } from "@/components/player/PlayerProvider";

export function MiniPlayer() {
  const {
    current,
    playing,
    progress,
    currentTime,
    duration,
    volume,
    muted,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
    stop,
  } = usePlayer();

  if (!current) return null;

  const isVideo = current.type === "video";

  return (
    <div className="fixed inset-x-0 bottom-[3.75rem] z-40 border-t border-line bg-[color-mix(in_oklab,var(--bg-elevated)_94%,transparent)] backdrop-blur-xl md:bottom-0">
      <div className="progress-bar !h-1 !rounded-none">
        <span style={{ width: `${isVideo ? 0 : progress}%` }} />
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

        <div className="flex items-center gap-1" dir="ltr">
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-2"
            onClick={prev}
            aria-label="قبلی"
            disabled={isVideo}
          >
            <SkipBack size={16} />
          </button>
          <button
            type="button"
            className="btn btn-primary !px-3 !py-2"
            onClick={toggle}
            disabled={isVideo}
            aria-label={playing ? "توقف" : "پخش"}
            title={isVideo ? "ویدئو را در صفحه اثر ببینید" : undefined}
          >
            {playing ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
          </button>
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-2"
            onClick={next}
            aria-label="بعدی"
            disabled={isVideo}
          >
            <SkipForward size={16} />
          </button>
        </div>

        <div className="hidden items-center gap-2 sm:flex" dir="ltr">
          <span className="w-9 text-left text-[11px] text-muted tabular-nums">
            {formatPlayerTime(isVideo ? 0 : currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={isVideo ? 0 : progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="player-seek w-28 lg:w-40"
            aria-label="پیشرفت پخش"
            disabled={isVideo}
          />
          <span className="w-9 text-right text-[11px] text-muted tabular-nums">
            {formatPlayerTime(isVideo ? 0 : duration)}
          </span>
        </div>

        <div className="hidden items-center gap-1 md:flex" dir="ltr">
          <button
            type="button"
            className="btn btn-ghost !px-2 !py-2"
            onClick={toggleMute}
            aria-label={muted ? "صدا روشن" : "بی‌صدا"}
            disabled={isVideo}
          >
            {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="player-volume w-20"
            aria-label="میزان صدا"
            disabled={isVideo}
          />
        </div>

        <button type="button" className="btn btn-ghost !px-2 !py-2" onClick={stop} aria-label="بستن">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
