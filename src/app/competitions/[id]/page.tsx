import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrackCard } from "@/components/track/TrackCard";
import {
  formatNumber,
  getApprovedTracks,
  getCompetitionById,
} from "@/data/mock";
import { statusLabel } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const c = getCompetitionById(id);
  return { title: c?.title ?? "مسابقه" };
}

export default async function CompetitionDetailPage({ params }: Props) {
  const { id } = await params;
  const competition = getCompetitionById(id);
  if (!competition) notFound();

  const entries = getApprovedTracks().filter((t) => t.competitionId === competition.id);

  return (
    <div>
      <section className="relative h-[360px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={competition.cover} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/55 to-black/20" />
        <div className="container-page absolute inset-x-0 bottom-0 pb-10">
          <span className="badge mb-3">{statusLabel(competition.status)}</span>
          <h1 className="font-display max-w-3xl text-3xl font-bold md:text-4xl">
            {competition.title}
          </h1>
          <p className="mt-3 max-w-2xl text-white/75">{competition.description}</p>
        </div>
      </section>

      <div className="container-page py-10">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Info label="مهلت" value={competition.deadline} />
          <Info label="تعداد آثار" value={formatNumber(competition.entriesCount)} />
          <Info label="جایزه" value={competition.prize} />
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title mb-0 text-xl">آثار شرکت‌کننده</h2>
          {competition.status === "active" && (
            <Link href="/upload" className="btn btn-primary text-sm">
              ارسال اثر به این مسابقه
            </Link>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
          {entries.length === 0 && (
            <p className="text-muted">هنوز اثری برای این مسابقه در دمو ثبت نشده است.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}
