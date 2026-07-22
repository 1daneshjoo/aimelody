import NodeID3 from "node-id3";
import { storeUpload } from "@/lib/ftp";
import { isAllowedDlUrl } from "@/lib/media";

export type AudioEmbedInput = {
  title: string;
  artistName: string;
  genre?: string | null;
  language?: string | null;
  lyricist?: string | null;
  lyrics?: string | null;
  aiTools?: string | null;
  description?: string | null;
  trackPublicId: string;
  mediaUrl: string;
  coverUrl?: string | null;
  storagePath?: string | null;
};

function appBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://aimelody.ir").replace(/\/+$/, "");
}

function isMp3(mediaUrl: string, contentType?: string | null) {
  if (contentType?.includes("mpeg") || contentType?.includes("mp3")) return true;
  try {
    const path = new URL(mediaUrl).pathname.toLowerCase();
    return path.endsWith(".mp3");
  } catch {
    return false;
  }
}

function storagePathFromUrl(mediaUrl: string) {
  try {
    const path = new URL(mediaUrl).pathname.replace(/^\/+/, "");
    return path || null;
  } catch {
    return null;
  }
}

async function fetchBuffer(url: string) {
  const res = await fetch(url, { headers: { Accept: "*/*" } });
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type"),
  };
}

async function fetchCoverImage(coverUrl?: string | null) {
  if (!coverUrl?.trim() || !/^https?:\/\//i.test(coverUrl)) return null;
  try {
    const { buffer, contentType } = await fetchBuffer(coverUrl);
    const mime = contentType?.includes("png")
      ? "image/png"
      : contentType?.includes("webp")
        ? "image/webp"
        : "image/jpeg";
    return { buffer, mime };
  } catch {
    return null;
  }
}

/** متادیتای نمایشی برای بخش جزئیات صفحه اثر */
export function buildTrackFileDetails(input: {
  title: string;
  artistName: string;
  genre?: string | null;
  language?: string | null;
  lyricist?: string | null;
  aiTools?: string | null;
  trackPublicId: string;
  mediaUrl: string;
}) {
  const siteUrl = appBaseUrl();
  const trackUrl = `${siteUrl}/track/${input.trackPublicId}`;
  const aiTools = (input.aiTools || "")
    .split(/[,،]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    siteName: "AiMelody.ir",
    siteUrl,
    trackUrl,
    title: input.title,
    artist: input.artistName,
    genre: input.genre || "—",
    language: input.language || "—",
    lyricist: input.lyricist || "—",
    aiTools,
    mediaUrl: input.mediaUrl,
  };
}

/**
 * تگ ID3 را داخل فایل MP3 می‌نویسد و دوباره روی dl ذخیره می‌کند.
 * برای فرمت‌های غیر MP3 یا خطا، false برمی‌گرداند.
 */
export async function embedAudioMetadata(input: AudioEmbedInput): Promise<boolean> {
  if (!isAllowedDlUrl(input.mediaUrl)) return false;

  const storagePath = input.storagePath?.trim() || storagePathFromUrl(input.mediaUrl);
  if (!storagePath || !storagePath.startsWith("audio/")) return false;

  try {
    const { buffer, contentType } = await fetchBuffer(input.mediaUrl);
    if (!isMp3(input.mediaUrl, contentType)) return false;

    const siteUrl = appBaseUrl();
    const trackUrl = `${siteUrl}/track/${input.trackPublicId}`;
    const commentLines = [
      `Site: ${siteUrl}`,
      `Track: ${trackUrl}`,
      input.lyricist ? `Lyricist: ${input.lyricist}` : null,
      input.aiTools ? `AI: ${input.aiTools}` : null,
      input.description?.trim() || null,
    ].filter(Boolean);

    const tags: NodeID3.Tags = {
      title: input.title,
      artist: input.artistName,
      album: "AiMelody.ir",
      genre: input.genre || undefined,
      comment: { language: "eng", text: commentLines.join(" | ") },
      unsynchronisedLyrics: input.lyrics?.trim()
        ? { language: "eng", text: input.lyrics.trim() }
        : undefined,
      userDefinedText: [
        { description: "SITE", value: siteUrl },
        { description: "TRACK_URL", value: trackUrl },
        { description: "PLATFORM", value: "AiMelody.ir" },
      ],
      copyright: `© ${new Date().getFullYear()} AiMelody.ir`,
    };

    const cover = await fetchCoverImage(input.coverUrl);
    if (cover) {
      tags.image = {
        mime: cover.mime,
        type: { id: 3, name: "front cover" },
        description: "Cover",
        imageBuffer: cover.buffer,
      };
    }

    const tagged = NodeID3.write(tags, buffer);
    if (!tagged) return false;

    await storeUpload(storagePath, tagged, contentType || "audio/mpeg");
    return true;
  } catch (e) {
    console.warn("[embedAudioMetadata]", e);
    return false;
  }
}
