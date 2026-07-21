/** CDN / download base for media files (public URL, not FTP host) */
export const DL_BASE =
  process.env.NEXT_PUBLIC_DL_BASE_URL ||
  process.env.DL_BASE_URL ||
  "https://dl.aimelody.ir";

export type MediaKind = "audio" | "video" | "covers" | "avatars";

/** Sanitize uploaded filename for CDN path */
export function sanitizeFileName(name: string) {
  return name
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w.\-()+\u0600-\u06FF]/g, "")
    .replace(/-+/g, "-")
    .toLowerCase();
}

/**
 * Monthly folder path on dl CDN
 * Example: https://dl.aimelody.ir/audio/2026/07/shabhaye-tehran.mp3
 */
export function buildDlUrl(
  kind: MediaKind,
  fileName: string,
  date: Date = new Date(),
) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const safe = sanitizeFileName(fileName) || `file-${Date.now()}`;
  return `${DL_BASE}/${kind}/${year}/${month}/${safe}`;
}

/** Relative storage path (for backend / FTP) */
export function buildDlPath(
  kind: MediaKind,
  fileName: string,
  date: Date = new Date(),
) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const safe = sanitizeFileName(fileName) || `file-${Date.now()}`;
  return `${kind}/${year}/${month}/${safe}`;
}

export function kindFromTrackType(type: "audio" | "video"): MediaKind {
  return type === "video" ? "video" : "audio";
}

/** سایز ثابت لود کاور در اسلایدر و اکسپلور (مربع) */
export const COVER_THUMB_SIZE = 400;

/**
 * مسیر کاور — فایل‌های محلی `/images/...` بدون تغییر برمی‌گردند.
 */
export function coverThumbUrl(url: string, _size = COVER_THUMB_SIZE) {
  return url;
}

export function avatarThumbUrl(url: string, _size = 160) {
  return url;
}

/** پسوند فایل از URL مدیا */
export function mediaExtension(
  mediaUrl: string,
  type: "audio" | "video" = "audio",
) {
  try {
    const path = new URL(mediaUrl).pathname;
    const match = path.match(/\.([a-z0-9]{2,5})$/i);
    if (match) return match[1].toLowerCase();
  } catch {
    // ignore invalid URL
  }
  return type === "video" ? "mp4" : "mp3";
}

/** نام امن فایل برای دانلود (با پسوند) */
export function downloadFileName(
  title: string,
  mediaUrl: string,
  type: "audio" | "video" = "audio",
) {
  const ext = mediaExtension(mediaUrl, type);
  const base =
    sanitizeFileName(title).replace(/\.[a-z0-9]{2,5}$/i, "") || "aimelody-track";
  return `${base}.${ext}`;
}

/** فقط URLهای CDN خودمان قابل پروکسی دانلود هستند */
export function isAllowedDlUrl(url: string) {
  try {
    const parsed = new URL(url);
    const base = new URL(DL_BASE);
    return parsed.origin === base.origin;
  } catch {
    return false;
  }
}
