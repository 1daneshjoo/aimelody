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
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUrl } from "@/lib/auth-routes";

type LibraryContextValue = {
  favoriteIds: string[];
  followingIds: string[];
  isFavorite: (trackId: string) => boolean;
  isFollowing: (artistId: string) => boolean;
  toggleFavorite: (trackId: string) => void;
  toggleFollow: (artistId: string) => void;
  favoriteCountDelta: (trackId: string) => number;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);
const FAV_KEY = "aimelody-favorites";
const FOLLOW_KEY = "aimelody-following";

function readList(key: string, fallback: string[] = []) {
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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);
  const baselineFavs = useRef<Set<string>>(new Set());
  const pendingFav = useRef<Set<string>>(new Set());
  const pendingFollow = useRef<Set<string>>(new Set());

  useEffect(() => {
    setFavoriteIds(readList(FAV_KEY));
    setFollowingIds(readList(FOLLOW_KEY));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || authLoading) return;

    if (!user) {
      setSynced(false);
      baselineFavs.current = new Set();
      return;
    }

    let active = true;
    fetch("/api/me/library", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { ok?: boolean; favoriteIds?: string[]; followingIds?: string[] }) => {
        if (!active || !data.ok) return;
        const favs = data.favoriteIds || [];
        const follows = data.followingIds || [];
        setFavoriteIds(favs);
        setFollowingIds(follows);
        baselineFavs.current = new Set(favs);
        setSynced(true);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [user, authLoading, ready]);

  useEffect(() => {
    if (!ready) return;
    if (user && synced) {
      localStorage.setItem(FAV_KEY, JSON.stringify(favoriteIds));
      localStorage.setItem(FOLLOW_KEY, JSON.stringify(followingIds));
    } else if (!user) {
      localStorage.setItem(FAV_KEY, JSON.stringify(favoriteIds));
      localStorage.setItem(FOLLOW_KEY, JSON.stringify(followingIds));
    }
  }, [favoriteIds, followingIds, ready, user, synced]);

  const toggleFavorite = useCallback(
    (trackId: string) => {
      if (!user) {
        router.push(loginUrl(pathname));
        return;
      }
      if (pendingFav.current.has(trackId)) return;

      const wasFav = favoriteIds.includes(trackId);
      setFavoriteIds((ids) =>
        wasFav ? ids.filter((id) => id !== trackId) : [...ids, trackId],
      );

      pendingFav.current.add(trackId);
      void fetch(`/api/tracks/${encodeURIComponent(trackId)}/favorite`, { method: "POST" })
        .then(async (res) => {
          const data = (await res.json()) as {
            ok?: boolean;
            favorited?: boolean;
            favoritesCount?: number;
          };
          if (!res.ok || !data.ok) {
            setFavoriteIds((ids) =>
              wasFav
                ? ids.includes(trackId)
                  ? ids
                  : [...ids, trackId]
                : ids.filter((id) => id !== trackId),
            );
            if (res.status === 401) router.push(loginUrl(pathname));
            return;
          }
          if (typeof data.favorited === "boolean") {
            setFavoriteIds((ids) => {
              const has = ids.includes(trackId);
              if (data.favorited && !has) return [...ids, trackId];
              if (!data.favorited && has) return ids.filter((id) => id !== trackId);
              return ids;
            });
            if (data.favorited) baselineFavs.current.add(trackId);
            else baselineFavs.current.delete(trackId);
          }
          if (typeof data.favoritesCount === "number") {
            window.dispatchEvent(
              new CustomEvent("aimelody:favorites", {
                detail: { trackId, favoritesCount: data.favoritesCount },
              }),
            );
          }
        })
        .catch(() => {
          setFavoriteIds((ids) =>
            wasFav
              ? ids.includes(trackId)
                ? ids
                : [...ids, trackId]
              : ids.filter((id) => id !== trackId),
          );
        })
        .finally(() => {
          pendingFav.current.delete(trackId);
        });
    },
    [user, favoriteIds, router, pathname],
  );

  const toggleFollow = useCallback(
    (artistId: string) => {
      if (!user) {
        router.push(loginUrl(pathname));
        return;
      }
      if (pendingFollow.current.has(artistId)) return;

      const wasFollowing = followingIds.includes(artistId);
      setFollowingIds((ids) =>
        wasFollowing ? ids.filter((id) => id !== artistId) : [...ids, artistId],
      );

      pendingFollow.current.add(artistId);
      void fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId }),
      })
        .then(async (res) => {
          const data = (await res.json()) as {
            ok?: boolean;
            following?: boolean;
            artistId?: string;
          };
          if (!res.ok || !data.ok) {
            setFollowingIds((ids) =>
              wasFollowing
                ? ids.includes(artistId)
                  ? ids
                  : [...ids, artistId]
                : ids.filter((id) => id !== artistId),
            );
            if (res.status === 401) router.push(loginUrl(pathname));
            return;
          }
          const id = data.artistId || artistId;
          if (typeof data.following === "boolean") {
            setFollowingIds((ids) => {
              const has = ids.includes(id);
              if (data.following && !has) return [...ids, id];
              if (!data.following && has) return ids.filter((x) => x !== id);
              return ids;
            });
          }
        })
        .catch(() => {
          setFollowingIds((ids) =>
            wasFollowing
              ? ids.includes(artistId)
                ? ids
                : [...ids, artistId]
              : ids.filter((id) => id !== artistId),
          );
        })
        .finally(() => {
          pendingFollow.current.delete(artistId);
        });
    },
    [user, followingIds, router, pathname],
  );

  const favoriteCountDelta = useCallback(
    (trackId: string) => {
      // تا همگام‌سازی با سرور، شمارش را تغییر نده تا دوباره‌شماری نشود
      if (user && !synced) return 0;
      const now = favoriteIds.includes(trackId);
      const was = baselineFavs.current.has(trackId);
      if (now === was) return 0;
      return now ? 1 : -1;
    },
    [favoriteIds, user, synced],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      followingIds,
      isFavorite: (id: string) => favoriteIds.includes(id),
      isFollowing: (id: string) => followingIds.includes(id),
      toggleFavorite,
      toggleFollow,
      favoriteCountDelta,
    }),
    [favoriteIds, followingIds, toggleFavorite, toggleFollow, favoriteCountDelta],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used within LibraryProvider");
  return ctx;
}
