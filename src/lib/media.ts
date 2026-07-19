/** CDN / download base for media files */
export const DL_BASE = "https://dl.aimelody.ir";

export type MediaKind = "audio" | "video" | "covers";

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
 * Monthly folder path on dl.aimelody.ir
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

/** Relative storage path (for backend / display) */
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

