"use client";

import Link from "next/link";
import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { avatarThumbUrl } from "@/lib/media";
import type { CreatorRank, Track } from "@/types";
import { TrackCard } from "@/components/track/TrackCard";

function RailNav({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <button
        type="button"
        onClick={onNext}
        className="btn btn-ghost !px-2.5 !py-2"
        aria-label="اسلاید بعدی"
      >
        <ChevronRight size={18} />
      </button>
      <button
        type="button"
        onClick={onPrev}
        className="btn btn-ghost !px-2.5 !py-2"
        aria-label="اسلاید قبلی"
      >
        <ChevronLeft size={18} />
      </button>
    </div>
  );
}

function useRailScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const scrollBy = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const amount = Math.min(el.clientWidth * 0.85, 420);
    el.scrollBy({ left: dir * -amount, behavior: "smooth" });
  };
  return { ref, prev: () => scrollBy(-1), next: () => scrollBy(1) };
}

export function TrackRail({
  title,
  subtitle,
  tracks,
  href = "/explore",
}: {
  title: string;
  subtitle?: string;
  tracks: Track[];
  href?: string;
}) {
  const { ref, prev, next } = useRailScroll();

  return (
    <section className="container-page py-8 md:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub mb-0">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <Link href={href} className="hidden text-sm text-accent sm:inline">
            مشاهده همه
          </Link>
          <RailNav onPrev={prev} onNext={next} />
        </div>
      </div>
      <div
        ref={ref}
        className="rail-track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth touch-pan-x"
      >
        {tracks.map((track) => (
          <div key={track.id} className="w-[168px] shrink-0 snap-start sm:w-[196px]">
            <TrackCard track={track} compact queue={tracks} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CreatorRail({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: CreatorRank[];
}) {
  const { ref, prev, next } = useRailScroll();

  return (
    <section className="container-page py-6 md:py-8">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub mb-0">{subtitle}</p>}
        </div>
        <RailNav onPrev={prev} onNext={next} />
      </div>
      <div
        ref={ref}
        className="rail-track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth touch-pan-x"
      >
        {items.map((person, index) => (
          <article
            key={person.id}
            className="surface flex w-[220px] shrink-0 snap-start flex-col items-center gap-3 p-5 text-center"
          >
            <span className="badge">رتبه {index + 1}</span>
            <Link href={`/artist/${person.id}`} className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatarThumbUrl(person.avatar, 160)}
                alt={person.name}
                width={160}
                height={160}
                loading="lazy"
                decoding="async"
                className="size-20 rounded-full object-cover object-center ring-2 ring-accent/30"
              />
              <div>
                <h3 className="font-bold hover:text-accent">{person.name}</h3>
                {person.bio && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{person.bio}</p>
                )}
              </div>
            </Link>
            <p className="text-sm text-accent">
              {person.metricLabel}: {person.metricValue}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
