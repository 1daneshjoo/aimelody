"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Music2 } from "lucide-react";
import { displayName, useAuth } from "@/components/auth/AuthProvider";
import { useLibrary } from "@/components/library/LibraryProvider";
import { getTrackById, getAllArtists } from "@/data/mock";
import type { MyTrack } from "@/lib/tracks";
import { cn, statusLabel } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "پروفایل" },
  { id: "works", label: "آثار من" },
  { id: "favorites", label: "علاقه‌مندی‌ها" },
  { id: "following", label: "دنبال‌شده‌ها" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("works");
  const [myTracks, setMyTracks] = useState<MyTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const { favoriteIds, followingIds, toggleFavorite } = useLibrary();
  const favorites = favoriteIds.map((id) => getTrackById(id)).filter(Boolean);
  const following = getAllArtists().filter((a) => followingIds.includes(a.id));

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setTracksLoading(true);
    fetch("/api/tracks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data: { ok: boolean; tracks?: MyTrack[] }) => {
        if (!active) return;
        setMyTracks(data.ok && data.tracks ? data.tracks : []);
      })
      .catch(() => {
        if (active) setMyTracks([]);
      })
      .finally(() => {
        if (active) setTracksLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading || !user) {
    return (
      <div className="container-page py-16 text-center text-muted">در حال بارگذاری...</div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="surface mb-8 flex flex-wrap items-center gap-4 p-5">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <span className="flex size-20 items-center justify-center rounded-full bg-accent-soft text-2xl text-accent">
            {displayName(user).slice(0, 1)}
          </span>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{displayName(user)}</h1>
          <p className="text-sm text-muted" dir="ltr">
            {user.phone}
          </p>
          <span className="badge mt-2 uppercase">{user.role}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/profile/setup" className="btn btn-ghost text-sm">
            ویرایش پروفایل
          </Link>
          {user.role === "admin" && (
            <Link href="/admin" className="btn btn-ghost text-sm">
              پنل مدیریت
            </Link>
          )}
          <Link href="/upload" className="btn btn-primary text-sm">
            اثر جدید
          </Link>
          <button type="button" className="btn btn-ghost text-sm" onClick={() => void logout()}>
            خروج
          </button>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-h-11 rounded-full border px-4 py-2 text-sm",
              tab === t.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="surface max-w-xl space-y-3 p-5 text-sm">
          <p>
            <span className="text-muted">نام نمایشی: </span>
            {displayName(user)}
          </p>
          <p dir="ltr">
            <span className="text-muted">موبایل: </span>
            {user.phone}
          </p>
          <Link href="/profile/setup" className="btn btn-primary mt-2 inline-flex text-sm">
            ویرایش نام و آواتار
          </Link>
        </div>
      )}

      {tab === "works" && (
        <div className="space-y-3">
          {tracksLoading && <p className="text-sm text-muted">در حال بارگذاری آثار...</p>}
          {!tracksLoading && myTracks.length === 0 && (
            <p className="text-sm text-muted">
              هنوز اثری ثبت نشده. از دکمه «اثر جدید» برای آپلود استفاده کنید.
            </p>
          )}
          {myTracks.map((t) => (
            <div key={t.id} className="surface flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt="" className="size-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.genre} · {t.type === "audio" ? "صوتی" : "ویدئویی"} · {t.createdAt}
                </p>
              </div>
              <span
                className={cn(
                  "badge",
                  t.status === "approved" && "text-success",
                  t.status === "rejected" && "text-danger",
                )}
              >
                <Music2 size={12} />
                {statusLabel(t.status)}
              </span>
              {t.status === "approved" && (
                <Link href={`/track/${t.id}`} className="text-sm text-accent">
                  مشاهده
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "favorites" && (
        <div className="space-y-3">
          {favorites.length === 0 && (
            <p className="text-sm text-muted">هنوز اثر علاقه‌مندی ندارید.</p>
          )}
          {favorites.map(
            (t) =>
              t && (
                <div key={t.id} className="surface flex items-center gap-4 p-4">
                  <Link href={`/track/${t.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.cover} alt="" className="size-16 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="font-bold">{t.title}</p>
                      <p className="text-sm text-muted">{t.artist.name}</p>
                    </div>
                  </Link>
                  <button
                    type="button"
                    className="btn btn-ghost !px-3"
                    onClick={() => toggleFavorite(t.id)}
                    aria-label="حذف از علاقه‌مندی"
                  >
                    <Heart size={16} className="text-accent" fill="currentColor" />
                  </button>
                </div>
              ),
          )}
        </div>
      )}

      {tab === "following" && (
        <div className="space-y-3">
          {following.length === 0 && (
            <p className="text-sm text-muted">هنوز کسی را دنبال نکرده‌اید.</p>
          )}
          {following.map((a) => (
            <Link
              key={a.id}
              href={`/artist/${a.id}`}
              className="surface flex items-center gap-4 p-4 transition hover:bg-bg-hover"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.avatar} alt="" className="size-14 rounded-full object-cover" />
              <div>
                <p className="font-bold">{a.name}</p>
                <p className="text-sm text-muted">{a.bio}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
