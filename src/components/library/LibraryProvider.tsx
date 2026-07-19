"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { favoriteIds as initialFavorites } from "@/data/mock";

type LibraryContextValue = {
  favoriteIds: string[];
  followingIds: string[];
  isFavorite: (trackId: string) => boolean;
  isFollowing: (artistId: string) => boolean;
  toggleFavorite: (trackId: string) => void;
  toggleFollow: (artistId: string) => void;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);
const FAV_KEY = "aimelody-favorites";
const FOLLOW_KEY = "aimelody-following";

function readList(key: string, fallback: string[]) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as string[]) : fallback;
  } catch {
    return fallback;
  }
}

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>(initialFavorites);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavoriteIds(readList(FAV_KEY, initialFavorites));
    setFollowingIds(readList(FOLLOW_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(FAV_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds, ready]);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(FOLLOW_KEY, JSON.stringify(followingIds));
  }, [followingIds, ready]);

  const toggleFavorite = useCallback((trackId: string) => {
    setFavoriteIds((ids) =>
      ids.includes(trackId) ? ids.filter((id) => id !== trackId) : [...ids, trackId],
    );
  }, []);

  const toggleFollow = useCallback((artistId: string) => {
    setFollowingIds((ids) =>
      ids.includes(artistId) ? ids.filter((id) => id !== artistId) : [...ids, artistId],
    );
  }, []);

  const value = useMemo(
    () => ({
      favoriteIds,
      followingIds,
      isFavorite: (id: string) => favoriteIds.includes(id),
      isFollowing: (id: string) => followingIds.includes(id),
      toggleFavorite,
      toggleFollow,
    }),
    [favoriteIds, followingIds, toggleFavorite, toggleFollow],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
