import type { ReactNode } from "react";
import type { Track } from "@/types";
import { buildTrackFileDetails } from "@/lib/audio-metadata";
import { ExternalLink } from "lucide-react";

export function TrackFileDetails({ track }: { track: Track }) {
  const details = buildTrackFileDetails({
    title: track.title,
    artistName: track.artist.name,
    genre: track.genre,
    language: track.language,
    lyricist: track.lyricist,
    aiTools: track.aiTools.join("، "),
    trackPublicId: track.id,
    mediaUrl: track.mediaUrl,
  });

  return (
    <div className="surface p-5 md:p-6">
      <h3 className="mb-4 font-bold">جزئیات فایل</h3>
      <dl className="grid gap-3 sm:grid-cols-2">
        <Detail label="عنوان" value={details.title} />
        <Detail label="سازنده" value={details.artist} />
        <Detail label="ژانر" value={details.genre} />
        <Detail label="زبان" value={details.language} />
        <Detail label="ترانه‌سرا" value={details.lyricist} />
        <Detail label="پلتفرم" value={details.siteName} />
        <Detail
          label="آدرس اثر"
          value={
            <a
              href={details.trackUrl}
              className="inline-flex items-center gap-1 text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {details.trackUrl.replace(/^https?:\/\//, "")}
              <ExternalLink size={12} />
            </a>
          }
        />
        <Detail
          label="آدرس سایت"
          value={
            <a
              href={details.siteUrl}
              className="text-accent hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {details.siteUrl.replace(/^https?:\/\//, "")}
            </a>
          }
        />
        {details.aiTools.length > 0 && (
          <div className="sm:col-span-2">
            <Detail label="ابزار هوش مصنوعی" value={details.aiTools.join("، ")} />
          </div>
        )}
      </dl>
      {track.type === "audio" && (
        <p className="mt-4 text-xs text-muted">
          هنگام آپلود، اطلاعات بالا به‌صورت خودکار در متادیتای فایل MP3 (ID3) نیز
          درج می‌شود.
        </p>
      )}
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-bg-soft px-3 py-3">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-bold break-all">{value}</dd>
    </div>
  );
}
