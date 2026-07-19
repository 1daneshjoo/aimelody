import Link from "next/link";
import type { CreatorRank, Track } from "@/types";
import { TrackCard } from "@/components/track/TrackCard";

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
  return (
    <section className="container-page py-8 md:py-10">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="section-sub mb-0">{subtitle}</p>}
        </div>
        <Link href={href} className="shrink-0 text-sm text-accent">
          مشاهده همه
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {tracks.map((track) => (
          <div key={track.id} className="w-[170px] shrink-0 sm:w-[200px]">
            <TrackCard track={track} compact />
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
  return (
    <section className="container-page py-6 md:py-8">
      <div className="mb-5">
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-sub mb-0">{subtitle}</p>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((person, index) => (
          <article
            key={person.id}
            className="surface flex w-[220px] shrink-0 flex-col items-center gap-3 p-5 text-center"
          >
            <span className="badge">رتبه {index + 1}</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={person.avatar}
              alt={person.name}
              className="size-20 rounded-full object-cover ring-2 ring-accent/30"
            />
            <div>
              <h3 className="font-bold">{person.name}</h3>
              {person.bio && (
                <p className="mt-1 line-clamp-2 text-xs text-muted">{person.bio}</p>
              )}
            </div>
            <p className="text-sm text-accent">
              {person.metricLabel}: {person.metricValue}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
