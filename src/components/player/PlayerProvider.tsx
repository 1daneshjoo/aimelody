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
import { recordPlayOnce } from "@/lib/record-play";

type PlayerContextValue = {
  current: Track | null;
  queue: Track[];
  playing: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playTrack: (track: Track, queue?: Track[]) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (percent: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  stop: () => void;
};

const PlayerContext = createContext<PlayerContextValue | null>(null);

function loadVolume() {
  if (typeof window === "undefined") return 0.85;
  const raw = window.localStorage.getItem("aimelody-volume");
  const n = raw == null ? 0.85 : Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.85;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [muted, setMuted] = useState(false);
  const volumeRef = useRef(0.85);

  useEffect(() => {
    const initial = loadVolume();
    volumeRef.current = initial;
    setVolumeState(initial);
    if (audioRef.current) audioRef.current.volume = initial;
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTime = () => {
      if (el.duration) {
        setProgress((el.currentTime / el.duration) * 100);
        setCurrentTime(el.currentTime);
        setDuration(el.duration);
      }
    };
    const onMeta = () => {
      setDuration(el.duration || 0);
    };
    const onEnded = () => {
      setPlaying(false);
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
              a.play()
                .then(() => {
                  setPlaying(true);
                  recordPlayOnce(nxt.id);
                })
                .catch(() => setPlaying(false));
            });
            return nxt;
          }
          return cur;
        });
        return q;
      });
    };

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnded);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnded);
    };
  }, []);

  const playTrack = useCallback((track: Track, nextQueue?: Track[]) => {
    const q = nextQueue?.length ? nextQueue : [track];
    setQueue(q);
    setCurrent(track);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    const el = audioRef.current;
    if (!el) return;
    if (track.type === "video") {
      el.pause();
      setPlaying(false);
      return;
    }
    el.src = track.mediaUrl;
    el.volume = muted ? 0 : volumeRef.current;
    el.play()
      .then(() => {
        setPlaying(true);
        recordPlayOnce(track.id);
      })
      .catch(() => setPlaying(false));
  }, [muted]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el || !current || current.type === "video") return;
    if (playing) {
      el.pause();
      setPlaying(false);
    } else {
      el.play()
        .then(() => {
          setPlaying(true);
          recordPlayOnce(current.id);
        })
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
    const el = audioRef.current;
    // اگر بیش از ۳ ثانیه گذشته، به ابتدای همان قطعه برگرد
    if (el && el.currentTime > 3) {
      el.currentTime = 0;
      setProgress(0);
      setCurrentTime(0);
      return;
    }
    const idx = queue.findIndex((t) => t.id === current.id);
    const prv = queue[idx - 1];
    if (prv) playTrack(prv, queue);
  }, [current, queue, playTrack]);

  const seek = useCallback((percent: number) => {
    const el = audioRef.current;
    if (!el?.duration) return;
    const clamped = Math.min(100, Math.max(0, percent));
    el.currentTime = (clamped / 100) * el.duration;
    setProgress(clamped);
    setCurrentTime(el.currentTime);
  }, []);

  const setVolume = useCallback((value: number) => {
    const clamped = Math.min(1, Math.max(0, value));
    volumeRef.current = clamped;
    setVolumeState(clamped);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("aimelody-volume", String(clamped));
    }
    const el = audioRef.current;
    if (!el) return;
    if (clamped > 0) {
      setMuted(false);
      el.muted = false;
      el.volume = clamped;
    } else {
      el.volume = 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const el = audioRef.current;
    setMuted((m) => {
      const nextMuted = !m;
      if (el) {
        el.muted = nextMuted;
        el.volume = nextMuted ? 0 : volumeRef.current;
      }
      return nextMuted;
    });
  }, []);

  const stop = useCallback(() => {
    const el = audioRef.current;
    el?.pause();
    setPlaying(false);
    setCurrent(null);
    setQueue([]);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  const value = useMemo(
    () => ({
      current,
      queue,
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
      stop,
    }),
    [
      current,
      queue,
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
      stop,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

/** mm:ss با ارقام فارسی */
export function formatPlayerTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const raw = `${m}:${s.toString().padStart(2, "0")}`;
  return raw.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]!);
}
