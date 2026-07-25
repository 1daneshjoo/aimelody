import { readFile } from "fs/promises";
import path from "path";
import NodeID3 from "node-id3";
import { storeUpload, isDlCpanelConfigured, isDlFtpConfigured, isDlHttpUploadConfigured } from "@/lib/ftp";
import { DL_BASE, isAllowedDlUrl } from "@/lib/media";

export type AudioEmbedInput = {
  title: string;
  artistName: string;
  genre?: string | null;
  language?: string | null;
  lyricist?: string | null;
  composer?: string | null;
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
  const lower = mediaUrl.toLowerCase();
  return lower.endsWith(".mp3") || lower.includes(".mp3?");
}

function storagePathFromUrl(mediaUrl: string) {
  try {
    if (mediaUrl.startsWith("/uploads/")) {
      return mediaUrl.replace(/^\/uploads\//, "");
    }
    const pathname = new URL(mediaUrl, appBaseUrl()).pathname.replace(/^\/+/, "");
    if (pathname.startsWith("uploads/")) return pathname.slice("uploads/".length);
    return pathname || null;
  } catch {
    return null;
  }
}

async function fetchBuffer(url: string) {
  const res = await fetch(url, { headers: { Accept: "*/*" }, cache: "no-store" });
  if (!res.ok) throw new Error(`fetch failed ${res.status} for ${url}`);
  return {
    buffer: Buffer.from(await res.arrayBuffer()),
    contentType: res.headers.get("content-type"),
  };
}

async function loadMediaBuffer(mediaUrl: string) {
  const raw = mediaUrl.trim();

  // فایل لوکال روی دامنه اصلی
  if (raw.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), "public", raw.replace(/^\/+/, ""));
    const buffer = await readFile(filePath);
    return { buffer, contentType: "audio/mpeg", source: "local" as const };
  }

  // URL کامل به uploads روی همین اپ
  try {
    const parsed = new URL(raw, appBaseUrl());
    if (parsed.pathname.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", parsed.pathname.replace(/^\/+/, ""));
      const buffer = await readFile(filePath);
      return { buffer, contentType: "audio/mpeg", source: "local" as const };
    }
  } catch {
    // continue
  }

  const { buffer, contentType } = await fetchBuffer(raw);
  return { buffer, contentType, source: "remote" as const };
}

async function fetchCoverImage(coverUrl?: string | null) {
  if (!coverUrl?.trim()) return null;
  try {
    const raw = coverUrl.trim();
    if (raw.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", raw.replace(/^\/+/, ""));
      const buffer = await readFile(filePath);
      const mime = raw.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      return { buffer, mime };
    }
    const { buffer, contentType } = await fetchBuffer(raw);
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

function hasRemoteUploadTarget() {
  return isDlCpanelConfigured() || isDlHttpUploadConfigured() || isDlFtpConfigured();
}

/**
 * تگ ID3 را داخل فایل MP3 می‌نویسد و دوباره ذخیره می‌کند.
 * برای فرمت‌های غیر MP3 یا خطا، false برمی‌گرداند.
 */
export async function embedAudioMetadata(input: AudioEmbedInput): Promise<boolean> {
  const storagePath = input.storagePath?.trim() || storagePathFromUrl(input.mediaUrl);
  if (!storagePath) {
    console.warn("[embedAudioMetadata] no storagePath", input.mediaUrl);
    return false;
  }

  // در production باید مقصد dl موجود باشد
  if (process.env.NODE_ENV === "production" && !hasRemoteUploadTarget()) {
    console.warn("[embedAudioMetadata] no DL upload target configured");
    return false;
  }

  try {
    const loaded = await loadMediaBuffer(input.mediaUrl);
    if (!isMp3(input.mediaUrl, loaded.contentType)) {
      console.warn("[embedAudioMetadata] not mp3", input.mediaUrl, loaded.contentType);
      return false;
    }

    const siteUrl = appBaseUrl();
    const trackUrl = `${siteUrl}/track/${input.trackPublicId}`;
    const dlUrl = isAllowedDlUrl(input.mediaUrl)
      ? input.mediaUrl
      : `${DL_BASE.replace(/\/+$/, "")}/${storagePath.replace(/^\/+/, "")}`;

    const commentParts = [
      input.description?.trim() || null,
      `AiMelody.ir`,
      `صفحه اثر: ${trackUrl}`,
      input.lyricist ? `ترانه‌سرا: ${input.lyricist}` : null,
      input.aiTools ? `AI: ${input.aiTools}` : null,
    ].filter(Boolean);

    const tags: NodeID3.Tags = {
      title: input.title,
      artist: input.artistName,
      album: "AiMelody.ir",
      genre: input.genre || undefined,
      composer: input.composer || input.lyricist || undefined,
      year: String(new Date().getFullYear()),
      comment: {
        language: "eng",
        text: commentParts.join("\n"),
      },
      unsynchronisedLyrics: input.lyrics?.trim()
        ? { language: "eng", text: input.lyrics.trim() }
        : undefined,
      userDefinedText: [
        { description: "SITE", value: siteUrl },
        { description: "TRACK_URL", value: trackUrl },
        { description: "PLATFORM", value: "AiMelody.ir" },
        { description: "MEDIA_URL", value: dlUrl },
      ],
      copyright: `© ${new Date().getFullYear()} AiMelody.ir — ${trackUrl}`,
    };

    const cover = await fetchCoverImage(input.coverUrl);
    if (cover && cover.buffer.length < 1.5 * 1024 * 1024) {
      tags.image = {
        mime: cover.mime,
        type: { id: 3, name: "front cover" },
        description: "Cover",
        imageBuffer: cover.buffer,
      };
    }

    const tagged = NodeID3.write(tags, loaded.buffer);
    if (!Buffer.isBuffer(tagged) || tagged.length < 128) {
      console.warn("[embedAudioMetadata] write returned invalid buffer");
      return false;
    }

    // تأیید خواندن تگ
    const written = NodeID3.read(tagged);
    if (!written?.title && !written?.artist) {
      console.warn("[embedAudioMetadata] tags not readable after write", written);
    }

    await storeUpload(storagePath, tagged, "audio/mpeg");
    console.info("[embedAudioMetadata] ok", {
      title: input.title,
      storagePath,
      bytes: tagged.length,
      tags: { title: written?.title, artist: written?.artist, album: written?.album },
    });
    return true;
  } catch (e) {
    console.warn("[embedAudioMetadata]", e);
    return false;
  }
}
