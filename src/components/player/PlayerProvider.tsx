"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Track } from "@/types";

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  playTrack: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (percent: number) => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => {
      if (el.duration) setProgress((el.currentTime / el.duration) * 100);
    };
    const onEnded = () => {
      setPlaying(false);
      // auto next
      setQueue((q) => {
        setCurrent((cur) => {
          if (!cur) return null;
          const idx = q.findIndex((t) => t.id === cur.id);
          const nxt = idx >= 0 ? q[idx + 1] : undefined;
          if (nxt) {
            queueMicrotask(() => {
              const a = audioRef.current;
              if (!a) return;
              a.src = nxt.mediaUrl;
              a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
            });
            return nxt;
          }
          return cur;
        });
        return q;
      });
    };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const playTrack = useCallback((track: Track, nextQueue?: Track[]) => {
    const q = nextQueue?.length ? nextQueue : [track];
    setQueue(q);
    setCurrent(track);
    setProgress(0);
    const el = audioRef.current;
    if (!el) return;
    if (track.type === "video") {
      // ویدئو در مینی‌پلیر پخش نمی‌شود؛ فقط صف/متادیتا
      el.pause();
      setPlaying(false);
      return;
    }
    el.src = track.mediaUrl;
    el.play()
      .then(() => setPlaying(true))
      .catch(() => setPlaying(false));
  }, []);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current || current.type === "video") return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, [current, playing]);

  const next = useCallback(() => {
    if (!current || !queue.length) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    const nxt = queue[idx + 1];
    if (nxt) playTrack(nxt, queue);
  }, [current, queue, playTrack]);

  const prev = useCallback(() => {
    if (!current || !queue.length) return;
    const idx = queue.findIndex((t) => t.id === current.id);
    const prv = queue[idx - 1];
    if (prv) playTrack(prv, queue);
  }, [current, queue, playTrack]);

  const seek = useCallback((percent: number) => {
    const el = audioRef.current;
    if (!el?.duration) return;
    el.currentTime = (percent / 100) * el.duration;
    setProgress(percent);
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    el?.pause();
    setPlaying(false);
    setCurrent(null);
    setQueue([]);
    setProgress(0);
  }, []);

  const value = useMemo(
    () => ({
      current,
      queue,
      playing,
      progress,
      playTrack,
      toggle,
      next,
      prev,
      seek,
      stop,
    }),
    [current, queue, playing, progress, playTrack, toggle, next, prev, seek, stop],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="none" className="hidden" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}
