"use client";

import Link from "next/link";
import {
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useMemo } from "react";
import type { Track } from "@/types";
import { formatPlayerTime, usePlayer } from "@/components/player/PlayerProvider";
import { cn } from "@/lib/utils";

function Waveform({ active, progress }: { active: boolean; progress: number }) {
  const bars = useMemo(
    () =>
      Array.from({ length: 72 }, (_, i) => {
        const wave = Math.sin(i * 0.35) * 28 + Math.sin(i * 0.11) * 18;
        const jitter = ((i * 37) % 23) - 11;
        return Math.max(18, Math.min(92, 48 + wave + jitter));
      }),
    [],
  );
  const pct = Math.min(100, Math.max(0, progress));

  return (
    <div
      dir="ltr"
      className="waveform relative flex h-20 w-full items-center gap-px"
      aria-hidden
    >
      {bars.map((h, i) => {
        const filled = ((i + 0.5) / bars.length) * 100 <= pct;
        return (
          <span
            key={i}
            className={cn("waveform-bar", filled && "is-played", active && "is-active")}
            style={{
              height: `${h}%`,
              animationDelay: `${(i % 12) * 0.07}s`,
              animationPlayState: active ? "running" : "paused",
            }}
          />
        );
      })}
    </div>
  );
}

export function AudioPlayer({ track }: { track: Track }) {
  const {
    current,
    playing,
    progress,
    currentTime,
    duration,
    volume,
    muted,
    playTrack,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleMute,
  } = usePlayer();

  const active = current?.id === track.id;
  const isPlaying = active && playing;
  const shownProgress = active ? progress : 0;
  const shownTime = active ? currentTime : 0;
  const shownDuration = active && duration > 0 ? duration : 0;

  const start = () => {
    if (active) toggle();
    else playTrack(track, [track]);
  };

  return (
    <div className="surface overflow-hidden p-5 md:p-7">
      <div className="grid gap-6 md:grid-cols-[260px_1fr] md:items-stretch">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.cover}
          alt={track.title}
          className="aspect-square w-full rounded-2xl object-cover shadow-2xl shadow-black/40"
        />

        <div className="flex min-w-0 flex-col justify-between gap-5">
          <div>
            <p className="badge mb-3">فایل صوتی</p>
            <h1 className="text-3xl font-bold md:text-4xl">{track.title}</h1>
            <p className="mt-2 text-muted">
              <Link href={`/artist/${track.artist.id}`} className="hover:text-accent">
                {track.artist.name}
              </Link>{" "}
              · {track.genre}
            </p>
          </div>

          <Waveform active={isPlaying} progress={shownProgress} />

          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-muted tabular-nums" dir="ltr">
              <span className="w-10 text-left">{formatPlayerTime(shownTime)}</span>
              <input
                type="range"
                min={0}
                max={100}
                step={0.1}
                value={shownProgress}
                onChange={(e) => {
                  if (!active) {
                    playTrack(track, [track]);
                  }
                  seek(Number(e.target.value));
                }}
                className="player-seek flex-1"
                aria-label="پیشرفت پخش"
              />
              <span className="w-10 text-right">
                {shownDuration > 0
                  ? formatPlayerTime(shownDuration)
                  : track.duration !== "—"
                    ? track.duration
                    : formatPlayerTime(0)}
              </span>
            </div>

            {/* کنترل‌های مدیا همیشه LTR: قبلی چپ، بعدی راست */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2" dir="ltr">
                <button
                  type="button"
                  className="btn btn-ghost !px-3"
                  onClick={() => {
                    if (!active) playTrack(track, [track]);
                    else prev();
                  }}
                  aria-label="قطعه قبلی"
                  title="قبلی"
                >
                  <SkipBack size={18} />
                </button>
                <button
                  type="button"
                  onClick={start}
                  className="btn btn-primary !size-12 !rounded-full !px-0"
                  aria-label={isPlaying ? "توقف" : "پخش"}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !px-3"
                  onClick={() => {
                    if (!active) playTrack(track, [track]);
                    else next();
                  }}
                  aria-label="قطعه بعدی"
                  title="بعدی"
                >
                  <SkipForward size={18} />
                </button>
              </div>

              <div className="flex min-w-[9rem] max-w-[14rem] flex-1 items-center gap-2" dir="ltr">
                <button
                  type="button"
                  className={cn("btn btn-ghost !px-2 !py-2", muted && "text-accent")}
                  onClick={toggleMute}
                  aria-label={muted ? "صدا روشن" : "بی‌صدا"}
                >
                  {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={muted ? 0 : volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="player-volume flex-1"
                  aria-label="میزان صدا"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
