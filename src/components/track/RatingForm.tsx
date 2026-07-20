"use client";

import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUrl } from "@/lib/auth-routes";
import { formatNumber } from "@/lib/catalog";
import type { RatingAverages, Track } from "@/types";
import { cn } from "@/lib/utils";

const fields = [
  { key: "lyrics", label: "کیفیت شعر و ترانه" },
  { key: "melody", label: "کیفیت ملودی و آهنگسازی" },
  { key: "vocals", label: "طبیعی بودن صدای خواننده" },
  { key: "visual", label: "کیفیت بصری", videoOnly: true },
  { key: "overall", label: "امتیاز کلی (Overall)" },
] as const;

type ScoreKey = "lyrics" | "melody" | "vocals" | "visual" | "overall";

function formatScore(value: number, plain?: boolean) {
  if (plain) return formatNumber(value);
  return new Intl.NumberFormat("fa-IR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function RatingForm({ track }: { track: Track }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [scores, setScores] = useState<Record<ScoreKey, number>>({
    lyrics: 0,
    melody: 0,
    vocals: 0,
    visual: 0,
    overall: 0,
  });
  const [averages, setAverages] = useState<RatingAverages>(track.ratings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/tracks/${encodeURIComponent(track.id)}/ratings`, { cache: "no-store" })
      .then((res) => res.json())
      .then(
        (data: {
          ok?: boolean;
          averages?: RatingAverages;
          mine?: Partial<Record<ScoreKey, number | null>> | null;
        }) => {
          if (!active || !data.ok) return;
          if (data.averages) setAverages(data.averages);
          if (data.mine) {
            setScores({
              lyrics: data.mine.lyrics || 0,
              melody: data.mine.melody || 0,
              vocals: data.mine.vocals || 0,
              visual: data.mine.visual || 0,
              overall: data.mine.overall || 0,
            });
          }
        },
      )
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [track.id]);

  const visible = fields.filter((f) => !("videoOnly" in f && f.videoOnly) || track.type === "video");

  const onSubmit = async () => {
    setMessage(null);
    setError(null);

    if (authLoading) return;
    if (!user) {
      router.push(loginUrl(pathname));
      return;
    }

    for (const field of visible) {
      if (!scores[field.key]) {
        setError(`لطفاً «${field.label}» را مشخص کنید`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tracks/${encodeURIComponent(track.id)}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lyrics: scores.lyrics,
          melody: scores.melody,
          vocals: scores.vocals,
          overall: scores.overall,
          visual: track.type === "video" ? scores.visual : null,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        averages?: RatingAverages;
      };
      if (!res.ok || !data.ok) {
        if (res.status === 401) {
          router.push(loginUrl(pathname));
          return;
        }
        setError(data.error || "ثبت رأی ناموفق بود");
        return;
      }
      if (data.averages) setAverages(data.averages);
      setMessage("رأی شما ذخیره شد. ممنون!");
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface p-5 md:p-6">
      <h2 className="section-title text-xl">امتیازدهی چندبُعدی</h2>
      <p className="section-sub text-sm">
        فقط کاربران واردشده می‌توانند رأی بدهند. رأی قبلی‌تان قابل ویرایش است.
      </p>

      <div className="space-y-5">
        {visible.map((field) => (
          <div key={field.key}>
            <div className="mb-2 flex items-center justify-between gap-3 text-sm">
              <span>{field.label}</span>
              <span className="text-accent">
                {scores[field.key] ? formatNumber(scores[field.key]) : "—"} / ۱۰
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn("star-btn p-1", scores[field.key] >= n && "active")}
                  onClick={() => setScores((s) => ({ ...s, [field.key]: n }))}
                  aria-label={`${field.label} ${formatNumber(n)}`}
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
        onClick={() => void onSubmit()}
        disabled={saving}
      >
        {saving ? "در حال ذخیره..." : "ثبت رأی"}
      </button>
      {message && <p className="mt-3 text-sm text-success">{message}</p>}
      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-3 border-t border-line pt-5 sm:grid-cols-3">
        <Stat label="شعر" value={averages.lyrics} />
        <Stat label="ملودی" value={averages.melody} />
        <Stat label="وکال" value={averages.vocals} />
        {track.type === "video" && <Stat label="بصری" value={averages.visual ?? 0} />}
        <Stat label="کلی" value={averages.overall} />
        <Stat label="تعداد رأی" value={averages.count} plain />
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
        {formatScore(value, plain)}
      </p>
    </div>
  );
}
