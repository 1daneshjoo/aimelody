"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrackCard } from "@/components/track/TrackCard";
import { TrackGridSkeleton } from "@/components/track/TrackCardSkeleton";
import { ads, genres, getApprovedTracks } from "@/data/mock";
import { mergeCatalogTracks, sortTracks } from "@/lib/catalog";
import { coverThumbUrl } from "@/lib/media";
import type { ChartPeriod, ChartSort, MediaType, Track } from "@/types";
import { cn } from "@/lib/utils";

const periods: { id: ChartPeriod; label: string }[] = [
  { id: "day", label: "برترین روز" },
  { id: "week", label: "برترین هفته" },
  { id: "month", label: "برترین ماه" },
  { id: "all", label: "تمام دوران" },
];

const sorts: { id: ChartSort; label: string }[] = [
  { id: "overall", label: "بالاترین امتیاز کلی" },
  { id: "lyrics", label: "بهترین ترانه" },
  { id: "melody", label: "بهترین ملودی" },
  { id: "vocals", label: "طبیعی‌ترین صدا" },
  { id: "visual", label: "بهترین موزیک‌ویدئو" },
  { id: "popular", label: "پرطرفدارترین" },
];

function ExploreInner() {
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState<ChartPeriod>("week");
  const [sort, setSort] = useState<ChartSort>("overall");
  const [genre, setGenre] = useState<string>("همه");
  const [type, setType] = useState<"all" | MediaType>("all");
  const [q, setQ] = useState("");
  const [booting, setBooting] = useState(true);
  const [dbTracks, setDbTracks] = useState<Track[]>([]);

  useEffect(() => {
    const qParam = searchParams.get("q");
    const genreParam = searchParams.get("genre");
    if (qParam) setQ(qParam);
    if (genreParam) setGenre(genreParam);
    const t = setTimeout(() => setBooting(false), 350);
    return () => clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/archive")
      .then((r) => r.json())
      .then((data: { ok?: boolean; tracks?: Track[] }) => {
        if (!cancelled && data.ok && data.tracks) setDbTracks(data.tracks);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const list = useMemo(() => {
    let items = mergeCatalogTracks(dbTracks, getApprovedTracks());
    if (genre !== "همه") items = items.filter((t) => t.genre === genre);
    if (type !== "all") items = items.filter((t) => t.type === type);
    if (q.trim()) {
      const query = q.trim();
      items = items.filter(
        (t) => t.title.includes(query) || t.artist.name.includes(query) || t.genre.includes(query),
      );
    }
    // فیلتر دوره زمانی روی createdAt فارسی سخت است؛ فعلاً همه را نگه می‌داریم
    void period;
    return sortTracks(items, sort);
  }, [genre, type, q, sort, period, dbTracks]);

  return (
    <div className="container-page py-10">
      <h1 className="section-title">آرشیو</h1>
      <p className="section-sub">فیلتر زمانی، ژانر و مرتب‌سازی تخصصی روی آثار منتشرشده</p>

      <div className="mb-6 flex flex-wrap gap-2">
        {periods.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={cn(
              "min-h-10 rounded-full border px-3 py-1.5 text-sm transition",
              period === p.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted hover:text-text",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="surface mb-5 grid gap-3 p-4 md:grid-cols-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی عنوان، هنرمند یا ژانر..."
              className="rounded-xl border border-line bg-bg-soft px-3 py-2.5 outline-none focus:border-accent md:col-span-2"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as ChartSort)}
              className="rounded-xl border border-line bg-bg-soft px-3 py-2.5 outline-none"
            >
              {sorts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "all" | MediaType)}
              className="rounded-xl border border-line bg-bg-soft px-3 py-2.5 outline-none"
            >
              <option value="all">همه انواع</option>
              <option value="audio">فقط صوت</option>
              <option value="video">فقط ویدئو</option>
            </select>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              {genres.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={cn(
                    "min-h-9 rounded-full px-3 py-1 text-xs",
                    genre === g ? "bg-accent text-[#1a1008]" : "bg-bg-soft text-muted",
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <p className="mb-4 text-sm text-muted">{list.length} اثر پیدا شد</p>
          {booting ? (
            <TrackGridSkeleton count={6} />
          ) : (
            <div className="grid grid-cols-2 items-start gap-4 sm:gap-6 xl:grid-cols-3">
              {list.map((track, i) => (
                <div key={track.id} className="min-w-0 w-full">
                  <TrackCard track={track} queue={list} />
                  {i === 2 && (
                    <a
                      href={ads[1].href}
                      className="mt-6 block overflow-hidden rounded-xl border border-line"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={coverThumbUrl(ads[1].image, 800)}
                        alt={ads[1].title}
                        width={800}
                        height={200}
                        loading="lazy"
                        className="h-24 w-full object-cover object-center"
                      />
                      <p className="bg-bg-elevated px-3 py-2 text-xs text-muted">
                        تبلیغ · {ads[1].title}
                      </p>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="surface overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ads[0].image} alt={ads[0].title} className="h-32 w-full object-cover" />
            <div className="p-4">
              <p className="text-xs text-muted">تبلیغات سایدبار</p>
              <p className="mt-1 text-sm font-bold">{ads[0].title}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="container-page py-10"><TrackGridSkeleton count={6} /></div>}>
      <ExploreInner />
    </Suspense>
  );
}
