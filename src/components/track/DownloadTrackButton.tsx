"use client";

import { Download } from "lucide-react";
import type { Track } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  track: Track;
  className?: string;
  iconOnly?: boolean;
};

export function DownloadTrackButton({
  track,
  className,
  iconOnly = false,
}: Props) {
  if (!track.mediaUrl && !track.id) return null;

  // دانلود با شناسه اثر — از DB آدرس واقعی خوانده می‌شود
  const href = `/api/download?id=${encodeURIComponent(track.id)}`;

  return (
    <a
      href={href}
      className={cn(
        "btn btn-ghost inline-flex items-center gap-2",
        iconOnly && "!px-3",
        className,
      )}
      download
      aria-label={track.type === "video" ? "دانلود ویدئو" : "دانلود موزیک"}
      title={track.type === "video" ? "دانلود ویدئو" : "دانلود موزیک"}
    >
      <Download size={iconOnly ? 18 : 16} />
      {!iconOnly && <span>دانلود</span>}
    </a>
  );
}
