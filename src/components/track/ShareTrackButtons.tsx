"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import type { Track } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  track: Track;
  className?: string;
};

function trackPageUrl(trackId: string) {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/track/${trackId}`;
  }
  return `https://aimelody.ir/track/${trackId}`;
}

function shareText(track: Track) {
  return `${track.title} — ${track.artist.name} | AiMelody.ir`;
}

const networks = [
  {
    id: "telegram",
    label: "تلگرام",
    color: "#229ED9",
    href: (url: string, text: string) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "bale",
    label: "بله",
    color: "#00ADEF",
    href: (url: string, text: string) =>
      `https://ble.ir/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "eitaa",
    label: "ایتا",
    color: "#F36C25",
    href: (url: string) =>
      `https://eitaa.com/share/url?url=${encodeURIComponent(url)}`,
  },
  {
    id: "rubika",
    label: "روبیکا",
    color: "#7B2D8E",
    href: (url: string, text: string) =>
      `https://rubika.ir/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    id: "whatsapp",
    label: "واتساپ",
    color: "#25D366",
    href: (url: string, text: string) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
] as const;

export function ShareTrackButtons({ track, className }: Props) {
  const [copied, setCopied] = useState(false);
  const url = trackPageUrl(track.id);
  const text = shareText(track);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const shareInstagram = async () => {
    await copyLink();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <div className={cn("surface p-4 md:p-5", className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-bold">
        <Share2 size={16} />
        اشتراک‌گذاری
      </div>
      <div className="flex flex-wrap gap-2">
        {networks.map((net) => (
          <a
            key={net.id}
            href={net.href(url, text)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost !px-3 !py-2 text-sm"
            style={{ borderColor: `${net.color}55` }}
          >
            <span
              className="size-2 rounded-full"
              style={{ background: net.color }}
              aria-hidden
            />
            {net.label}
          </a>
        ))}
        <button
          type="button"
          onClick={shareInstagram}
          className="btn btn-ghost !px-3 !py-2 text-sm"
          style={{ borderColor: "#E1306C55" }}
          title="لینک کپی می‌شود؛ در اینستاگرام پیست کنید"
        >
          <span className="size-2 rounded-full bg-[#E1306C]" aria-hidden />
          اینستاگرام
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="btn btn-ghost !px-3 !py-2 text-sm"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "کپی شد" : "کپی لینک"}
        </button>
      </div>
    </div>
  );
}
