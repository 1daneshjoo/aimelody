"use client";

import { Star } from "lucide-react";
import { useState } from "react";
import type { Track } from "@/types";
import { cn } from "@/lib/utils";

const fields = [
  { key: "lyrics", label: "کیفیت شعر و ترانه" },
  { key: "melody", label: "کیفیت ملودی و آهنگسازی" },
  { key: "vocals", label: "طبیعی بودن صدای خواننده" },
  { key: "visual", label: "کیفیت بصری", videoOnly: true },
  { key: "overall", label: "امتیاز کلی (Overall)" },
] as const;

type ScoreKey = "lyrics" | "melody" | "vocals" | "visual" | "overall";

export function RatingForm({ track }: { track: Track }) {
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    lyrics: 0,
    melody: 0,
    vocals: 0,
    visual: 0,
    overall: 0,
  });
  const [submitted, setSubmitted] = useState(false);

  const visible = fields.filter((f) => !("videoOnly" in f && f.videoOnly) || track.type === "video");

  return (
    <div className="surface p-5 md:p-6">
      <h2 className="section-title text-xl">امتیازدهی چندبُعدی</h2>
      <p className="section-sub text-sm">
        فقط کاربران لاگین‌شده با موبایل می‌توانند رأی بدهند. (در نسخه دمو بدون ارسال واقعی)
      </p>

      <div className="space-y-5">
        {visible.map((field) => (
          <div key={field.key}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span>{field.label}</span>
              <span className="text-accent">{scores[field.key] || "—"} / ۱۰</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn("star-btn p-1", scores[field.key] >= n && "active")}
                  onClick={() => setScores((s) => ({ ...s, [field.key]: n }))}
                  aria-label={`${field.label} ${n}`}
                >
                  <Star size={18} fill={scores[field.key] >= n ? "currentColor" : "none"} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="btn btn-primary mt-6 w-full sm:w-auto"
        onClick={() => setSubmitted(true)}
      >
        ثبت رأی
      </button>
      {submitted && (
        <p className="mt-3 text-sm text-success">رأی شما در حالت دمو ذخیره شد. ممنون!</p>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-3">
        <Stat label="شعر" value={track.ratings.lyrics} />
        <Stat label="ملودی" value={track.ratings.melody} />
        <Stat label="وکال" value={track.ratings.vocals} />
        {track.type === "video" && <Stat label="بصری" value={track.ratings.visual ?? 0} />}
        <Stat label="کلی" value={track.ratings.overall} />
        <Stat label="تعداد رأی" value={track.ratings.count} plain />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  plain,
}: {
  label: string;
  value: number;
  plain?: boolean;
}) {
  return (
    <div className="rounded-xl bg-bg-soft px-3 py-3 text-center">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-lg font-bold text-accent">
        {plain ? value : value.toFixed(1)}
      </p>
    </div>
  );
}
