import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { AudioPlayer } from "@/components/track/AudioPlayer";
import { Comments } from "@/components/track/Comments";
import { RatingForm } from "@/components/track/RatingForm";
import { VideoPlayer } from "@/components/track/VideoPlayer";
import {
  formatNumber,
  getCommentsByTrack,
  getCompetitionById,
  getTrackById,
  vocalSourceLabel,
} from "@/data/mock";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = getTrackById(id);
  return { title: track?.title ?? "اثر یافت نشد" };
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const track = getTrackById(id);
  if (!track || track.status !== "approved") notFound();

  const trackComments = getCommentsByTrack(track.id);
  const competition = track.competitionId
    ? getCompetitionById(track.competitionId)
    : undefined;

  return (
    <div className="container-page py-8 md:py-10">
      {track.type === "audio" ? (
        <AudioPlayer track={track} />
      ) : (
        <VideoPlayer track={track} />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="surface p-5 md:p-6">
            <div className="flex flex-wrap gap-2 text-sm text-muted">
              <span>{formatNumber(track.plays)} پخش</span>
              <span>·</span>
              <span>{formatNumber(track.favorites)} علاقه‌مندی</span>
              <span>·</span>
              <span>{track.createdAt}</span>
            </div>
            {track.description && <p className="mt-4 text-muted">{track.description}</p>}

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Credit label="شاعر / ترانه‌سرا" value={track.lyricist} />
              <Credit label="مالک صدای خواننده" value={track.vocalOwner} />
              <Credit label="منبع صدا" value={vocalSourceLabel(track.vocalSource)} />
              {track.composer && <Credit label="آهنگساز" value={track.composer} />}
              {track.language && <Credit label="زبان" value={track.language} />}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {track.aiTools.map((tool) => (
                <span key={tool} className="badge">
                  <Sparkles size={12} />
                  {tool}
                </span>
              ))}
            </div>

            {competition && (
              <p className="mt-4 text-sm">
                شرکت در مسابقه:{" "}
                <Link href={`/competitions/${competition.id}`} className="text-accent">
                  {competition.title}
                </Link>
              </p>
            )}
          </div>

          <TrackTabs lyrics={track.lyrics} prompt={track.prompt} />

          <Comments items={trackComments} />
        </div>

        <div className="space-y-6">
          <div className="surface flex items-center gap-3 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.artist.avatar}
              alt={track.artist.name}
              className="size-14 rounded-full object-cover"
            />
            <div>
              <p className="text-xs text-muted">سازنده</p>
              <p className="font-bold">{track.artist.name}</p>
              <p className="text-sm text-muted">{track.artist.bio}</p>
            </div>
          </div>
          <RatingForm track={track} />
        </div>
      </div>
    </div>
  );
}

function Credit({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-bg-soft px-3 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function TrackTabs({ lyrics, prompt }: { lyrics?: string; prompt?: string }) {
  return (
    <div className="surface p-5 md:p-6">
      <div className="mb-4 flex gap-4 border-b border-line text-sm">
        <span className="tab-active pb-2">متن ترانه</span>
        <span className="pb-2 text-muted">پرامپت</span>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 font-bold">متن ترانه</h3>
          {lyrics ? (
            <pre className="whitespace-pre-wrap font-[inherit] text-muted leading-8">{lyrics}</pre>
          ) : (
            <p className="text-sm text-muted">متن ترانه‌ای ثبت نشده است.</p>
          )}
        </div>

        <div className="border-t border-line pt-5">
          <h3 className="mb-3 font-bold">پرامپت استفاده شده</h3>
          {prompt ? (
            <p className="rounded-xl bg-bg-soft p-4 text-sm text-muted">{prompt}</p>
          ) : (
            <p className="text-sm text-muted">پرامپتی ثبت نشده است.</p>
          )}
        </div>
      </div>
    </div>
  );
}
