"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Music2 } from "lucide-react";
import { useLibrary } from "@/components/library/LibraryProvider";
import { currentUser, getTrackById, getUserTracks, getAllArtists } from "@/data/mock";
import { statusLabel, cn } from "@/lib/utils";

const tabs = [
  { id: "profile", label: "پروفایل" },
  { id: "works", label: "آثار من" },
  { id: "favorites", label: "علاقه‌مندی‌ها" },
  { id: "following", label: "دنبال‌شده‌ها" },
] as const;

export default function DashboardPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("works");
  const myTracks = getUserTracks(currentUser.id);
  const { favoriteIds, followingIds, toggleFavorite } = useLibrary();
  const favorites = favoriteIds.map((id) => getTrackById(id)).filter(Boolean);
  const following = getAllArtists().filter((a) => followingIds.includes(a.id));

  return (
    <div className="container-page py-10">
      <div className="surface mb-8 flex flex-wrap items-center gap-4 p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="size-20 rounded-full object-cover"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{currentUser.name}</h1>
          <p className="text-sm text-muted">
            {currentUser.phone} · عضویت از {currentUser.joinedAt}
          </p>
          <span className="badge mt-2 uppercase">{currentUser.role}</span>
        </div>
        <Link href="/upload" className="btn btn-primary text-sm">
          اثر جدید
        </Link>
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
        <form className="surface max-w-xl space-y-4 p-5" onSubmit={(e) => e.preventDefault()}>
          <label className="block space-y-2 text-sm">
            <span className="text-muted">نام نمایشی</span>
            <input className="field" defaultValue={currentUser.name} />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="text-muted">بیو</span>
            <textarea className="field min-h-24" defaultValue={currentUser.bio} />
          </label>
          <button type="submit" className="btn btn-primary">
            ذخیره تغییرات (دمو)
          </button>
        </form>
      )}

      {tab === "works" && (
        <div className="space-y-3">
          {myTracks.map((t) => (
            <div key={t.id} className="surface flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt="" className="size-16 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.genre} · {t.createdAt}
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
