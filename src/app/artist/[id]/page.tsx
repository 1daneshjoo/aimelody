import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArtistActions } from "@/components/artist/ArtistActions";
import { TrackCard } from "@/components/track/TrackCard";
import {
  formatNumber,
  getArtistById,
  getTracksByArtist,
} from "@/data/mock";
import {
  getApprovedTracksByArtistUserId,
  getArtistByParam,
} from "@/lib/tracks-server";

type Props = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const artist = await getArtistByParam(id);
    if (artist) return { title: artist.name };
  } catch {
    // fallback mock
  }
  const mock = getArtistById(id);
  return { title: mock?.name ?? "هنرمند" };
}

export default async function ArtistPage({ params }: Props) {
  const { id } = await params;

  let artist = null as Awaited<ReturnType<typeof getArtistByParam>>;
  let works = [] as Awaited<ReturnType<typeof getApprovedTracksByArtistUserId>>;

  try {
    artist = await getArtistByParam(id);
    if (artist) {
      works = await getApprovedTracksByArtistUserId(artist.userId);
    }
  } catch (e) {
    console.error("[artist]", e);
  }

  if (!artist) {
    const mockArtist = getArtistById(id);
    if (!mockArtist) notFound();
    const mockWorks = getTracksByArtist(mockArtist.id);
    return <ArtistView artist={mockArtist} works={mockWorks} />;
  }

  return <ArtistView artist={artist} works={works} />;
}

function ArtistView({
  artist,
  works,
}: {
  artist: { id: string; name: string; avatar: string; bio?: string };
  works: ReturnType<typeof getTracksByArtist>;
}) {
  const avg =
    works.length > 0
      ? works.reduce((s, t) => s + t.ratings.overall, 0) / works.length
      : 0;
  const plays = works.reduce((s, t) => s + t.plays, 0);

  return (
    <div className="container-page py-10">
      <div className="surface mb-8 flex flex-wrap items-center gap-5 p-5 md:p-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artist.avatar}
          alt={artist.name}
          className="size-24 rounded-full object-cover ring-2 ring-accent/30 md:size-28"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">پروفایل سازنده</p>
          <h1 className="text-2xl font-bold md:text-3xl">{artist.name}</h1>
          {artist.bio && <p className="mt-2 max-w-xl text-muted">{artist.bio}</p>}
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
            <span>{formatNumber(works.length)} اثر</span>
            <span>·</span>
            <span>
              میانگین{" "}
              {new Intl.NumberFormat("fa-IR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }).format(avg)}
            </span>
            <span>·</span>
            <span>{formatNumber(plays)} پخش</span>
          </div>
        </div>
        <ArtistActions artistId={artist.id} />
      </div>

      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 className="section-title mb-0 text-xl">آثار {artist.name}</h2>
        <Link href="/explore" className="text-sm text-accent">
          آرشیو
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 xl:grid-cols-3">
        {works.map((track) => (
          <TrackCard key={track.id} track={track} queue={works} />
        ))}
      </div>

      {works.length === 0 && (
        <p className="text-muted">هنوز اثر تاییدشده‌ای برای این هنرمند نیست.</p>
      )}
    </div>
  );
}
