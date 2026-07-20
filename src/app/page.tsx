import Link from "next/link";
import { Trophy } from "lucide-react";
import { CreatorRail, TrackRail } from "@/components/home/Rails";
import {
  competitions,
  formatNumber,
  getApprovedTracks,
  getPromotedTracks,
  getTopCreators,
  getTopLyricists,
  sortTracks,
} from "@/data/mock";

export default function HomePage() {
  const approved = getApprovedTracks();
  const featured = getPromotedTracks()[0] ?? sortTracks(approved, "overall")[0];
  const topMusics = sortTracks(approved, "overall").slice(0, 10);
  const topLyrics = sortTracks(approved, "lyrics").slice(0, 10);
  const topMelody = sortTracks(approved, "melody").slice(0, 10);
  const topCreators = getTopCreators().slice(0, 10);
  const topLyricists = getTopLyricists().slice(0, 10);
  const activeCompetitions = competitions.filter((c) => c.status === "active");

  return (
    <>
      <section className="relative min-h-[min(88vh,820px)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={featured.cover}
          alt=""
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 hero-scrim" />
        <div className="hero-glow absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <div className="container-page relative flex min-h-[min(88vh,820px)] flex-col justify-end pb-16 pt-28">
          <p className="fade-up text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl drop-shadow-md">
            Ai<span className="text-accent">Melody</span>
          </p>
          <h1 className="fade-up-delay mt-4 max-w-2xl text-2xl font-medium leading-relaxed text-white/95 md:text-3xl drop-shadow">
            جایی که آثار هوش مصنوعی شنیده، سنجیده و دیده می‌شوند.
          </h1>
          <p className="fade-up-delay-2 mt-4 max-w-xl text-base text-white/80 md:text-lg">
            ویترین صوت و ویدئو، چارت‌های تخصصی و مسابقات فصلی — همه در یک خانه.
          </p>
          <div className="fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/explore" className="btn btn-primary">
              ورود به آرشیو
            </Link>
            <Link href="/upload" className="btn btn-ghost border-white/20 bg-black/25 text-white">
              ارسال اثر
            </Link>
          </div>
        </div>
      </section>

      <TrackRail
        title="برترین موزیک‌ها"
        subtitle="بر اساس بالاترین امتیاز کلی"
        tracks={topMusics}
        href="/explore"
      />
      <TrackRail
        title="برترین ترانه‌ها"
        subtitle="بر اساس کیفیت شعر و ترانه"
        tracks={topLyrics}
        href="/explore"
      />
      <TrackRail
        title="برترین ملودی"
        subtitle="بر اساس کیفیت ملودی و آهنگسازی"
        tracks={topMelody}
        href="/explore"
      />

      <CreatorRail
        title="برترین سازنده"
        subtitle="سازندگان با بالاترین میانگین امتیاز آثار"
        items={topCreators}
      />
      <CreatorRail
        title="برترین ترانه‌سرا"
        subtitle="نویسندگان با بالاترین میانگین امتیاز شعر"
        items={topLyricists}
      />

      <section className="container-page pb-16 pt-4">
        <div className="mb-6 flex items-center gap-2">
          <Trophy className="text-accent" size={22} />
          <h2 className="section-title mb-0">مسابقات فعال</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {activeCompetitions.map((c) => (
            <Link
              key={c.id}
              href={`/competitions/${c.id}`}
              className="group relative overflow-hidden rounded-2xl border border-line"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.cover}
                alt={c.title}
                referrerPolicy="no-referrer"
                className="h-56 w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="badge mb-2">فعال · {formatNumber(c.entriesCount)} اثر</span>
                <h3 className="text-xl font-bold text-white">{c.title}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/70">{c.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
