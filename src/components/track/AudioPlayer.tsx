"use client";

import { Pause, Play, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { Track } from "@/types";

function Waveform({ active }: { active: boolean }) {
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => 20 + ((i * 17) % 70)), []);
  return (
    <div className="waveform flex h-12 items-end justify-center gap-px overflow-hidden rounded-xl bg-black/25 px-3 py-2">
      {bars.map((h, i) => (
        <span
          key={i}
          style={{
            height: `${h}%`,
            animationDelay: `${i * 0.04}s`,
            animationPlayState: active ? "running" : "paused",
            opacity: active ? 1 : 0.35,
          }}
        />
      ))}
    </div>
  );
}

export function AudioPlayer({ track }: { track: Track }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = async () => {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      await el.play();
      setPlaying(true);
    }
  };

  return (
    <div className="surface overflow-hidden p-5 md:p-7">
      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={track.cover}
          alt={track.title}
          className="aspect-square w-full rounded-2xl object-cover shadow-2xl shadow-black/40"
        />
        <div className="flex flex-col justify-between gap-4">
          <div>
            <p className="badge mb-3">فایل صوتی</p>
            <h1 className="font-display text-3xl font-bold md:text-4xl">{track.title}</h1>
            <p className="mt-2 text-muted">{track.artist.name} · {track.genre}</p>
          </div>
          <Waveform active={playing} />
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={progress}
              onChange={(e) => {
                const el = audioRef.current;
                const value = Number(e.target.value);
                setProgress(value);
                if (el && el.duration) {
                  el.currentTime = (value / 100) * el.duration;
                }
              }}
            />
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button type="button" className="btn btn-ghost !px-3" aria-label="قبلی">
                  <SkipBack size={16} />
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  className="btn btn-primary !px-5"
                  aria-label={playing ? "توقف" : "پخش"}
                >
                  {playing ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
                </button>
                <button type="button" className="btn btn-ghost !px-3" aria-label="بعدی">
                  <SkipForward size={16} />
                </button>
              </div>
              <div className="hidden items-center gap-2 text-muted sm:flex">
                <Volume2 size={16} />
                <span className="text-sm">{track.duration}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <audio
        ref={audioRef}
        src={track.mediaUrl}
        preload="none"
        onTimeUpdate={(e) => {
          const el = e.currentTarget;
          if (el.duration) setProgress((el.currentTime / el.duration) * 100);
        }}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
