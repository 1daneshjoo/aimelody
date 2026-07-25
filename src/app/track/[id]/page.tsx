import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Sparkles } from "lucide-react";
import { ArtistActions } from "@/components/artist/ArtistActions";
import { AudioPlayer } from "@/components/track/AudioPlayer";
import { Comments } from "@/components/track/Comments";
import { RatingForm } from "@/components/track/RatingForm";
import { ShareTrackButtons } from "@/components/track/ShareTrackButtons";
import { TrackStats } from "@/components/track/TrackStats";
import { VideoPlayer } from "@/components/track/VideoPlayer";
import {
  getCommentsByTrack,
  getCompetitionById,
  getTrackById,
  vocalSourceLabel,
} from "@/data/mock";
import { getServerSession } from "@/lib/auth";
import { getCommentsForTrackPublicId } from "@/lib/social";
import { getTrackByPublicId, getTrackForViewer } from "@/lib/tracks-server";
import { statusLabel } from "@/lib/utils";
import type { Track } from "@/types";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const track = (await getTrackByPublicId(id).catch(() => null)) ?? getTrackById(id);
  return { title: track?.title ?? "اثر یافت نشد" };
}

export default async function TrackPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession();

  let track: Track | null = null;
  let access: { isOwner: boolean; isAdmin: boolean } = { isOwner: false, isAdmin: false };

  try {
    const viewed = await getTrackForViewer(id, session);
    if (viewed) {
      track = viewed.track;
      access = { isOwner: viewed.isOwner, isAdmin: viewed.isAdmin };
    }
  } catch {
    // fallback mock
  }

  if (!track) {
    const mock = getTrackById(id);
    if (!mock || mock.status !== "approved") notFound();
    track = mock;
  }

  let trackComments = getCommentsByTrack(track.id);
  try {
    trackComments = await getCommentsForTrackPublicId(track.id);
  } catch {
    // keep mock comments as fallback for offline/mock tracks
  }

  const competition = track.competitionId
    ? getCompetitionById(track.competitionId)
    : undefined;

  const showModerationBanner = track.status !== "approved" && (access.isAdmin || access.isOwner);

  return (
    <div className="container-page py-8 md:py-10">
      {showModerationBanner && (
        <div className="mb-4 rounded-xl border border-accent/40 bg-accent-soft px-4 py-3 text-sm text-accent">
          وضعیت اثر: <strong>{statusLabel(track.status)}</strong>
          {access.isAdmin ? " — فقط مدیر و مالک می‌توانند این صفحه را ببینند." : " — هنوز برای عموم منتشر نشده است."}
        </div>
      )}

      {track.type === "audio" ? (
        <AudioPlayer track={track} />
      ) : (
        <VideoPlayer track={track} />
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          <div className="surface p-5 md:p-6">
            <TrackStats
              trackId={track.id}
              plays={track.plays}
              favorites={track.favorites}
              createdAt={track.createdAt}
            />
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

          <div className="surface p-5 md:p-6">
            <h3 className="mb-3 font-bold">متن ترانه</h3>
            {track.lyrics ? (
              <pre className="whitespace-pre-wrap font-[inherit] text-muted leading-8">
                {track.lyrics}
              </pre>
            ) : (
              <p className="text-sm text-muted">متن ترانه‌ای ثبت نشده است.</p>
            )}
          </div>

          {track.status === "approved" && <ShareTrackButtons track={track} />}

          <Comments trackId={track.id} items={trackComments} />
        </div>

        <div className="space-y-6">
          <div className="surface flex flex-wrap items-center gap-3 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.artist.avatar}
              alt={track.artist.name}
              className="size-14 rounded-full object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">سازنده</p>
              <Link
                href={`/artist/${track.artist.id}`}
                className="font-bold hover:text-accent"
              >
                {track.artist.name}
              </Link>
              {track.artist.bio && (
                <p className="text-sm text-muted line-clamp-2">{track.artist.bio}</p>
              )}
            </div>
            <ArtistActions artistId={track.artist.id} />
          </div>
          {track.status === "approved" && <RatingForm track={track} />}
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
