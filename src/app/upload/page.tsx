"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { competitions } from "@/data/mock";
import { requestSignedUpload, uploadToSignedUrl } from "@/lib/upload";
import { cn } from "@/lib/utils";

const steps = ["اطلاعات اثر", "فایل و کاور", "عوامل و حقوق", "جزئیات تکمیلی", "بازبینی"];

const vocalSources = [
  { value: "ai", label: "تولیدشده با هوش مصنوعی" },
  { value: "own", label: "صدای خودم / ضبط شخصی" },
  { value: "licensed", label: "لایسنس‌شده از شخص/استودیو دیگر" },
  { value: "other", label: "سایر" },
];

export default function UploadPage() {
  return (
    <Suspense>
      <UploadForm />
    </Suspense>
  );
}

function UploadForm() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    type: "audio",
    genre: "پاپ",
    language: "فارسی",
    lyricist: "",
    composer: "",
    vocalOwner: "",
    vocalSource: "ai",
    rightsConfirm: false,
    lyrics: "",
    aiTools: "",
    prompt: "",
    description: "",
    competitionId: "",
  });

  const update = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submitUpload = async () => {
    if (!mediaFile || !coverFile) return;
    setUploading(true);
    setProgress(0);
    setError("");
    try {
      const mediaSigned = await requestSignedUpload({
        fileName: mediaFile.name,
        contentType: mediaFile.type || (form.type === "video" ? "video/mp4" : "audio/mpeg"),
        mediaType: form.type === "video" ? "video" : "audio",
        sizeBytes: mediaFile.size,
      });
      const mediaUploaded = await uploadToSignedUrl(mediaFile, mediaSigned, (p) =>
        setProgress(Math.min(65, p * 0.65)),
      );

      const coverSigned = await requestSignedUpload({
        fileName: coverFile.name,
        contentType: coverFile.type || "image/jpeg",
        mediaType: "cover",
        sizeBytes: coverFile.size,
      });
      const coverUploaded = await uploadToSignedUrl(coverFile, coverSigned, (p) =>
        setProgress(65 + Math.round(p * 0.25)),
      );

      setProgress(92);

      const trackRes = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          genre: form.genre,
          language: form.language,
          lyricist: form.lyricist,
          composer: form.composer,
          vocalOwner: form.vocalOwner,
          vocalSource: form.vocalSource,
          lyrics: form.lyrics,
          aiTools: form.aiTools,
          prompt: form.prompt,
          description: form.description,
          competitionId: form.competitionId || null,
          mediaUrl: mediaUploaded.publicUrl,
          coverUrl: coverUploaded.publicUrl,
          mediaStoragePath: mediaUploaded.storagePath,
        }),
      });
      const trackData = (await trackRes.json()) as { ok: boolean; error?: string };
      if (!trackRes.ok || !trackData.ok) {
        throw new Error(trackData.error || "ثبت اثر در دیتابیس ناموفق بود");
      }

      setProgress(100);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود ناموفق بود");
    } finally {
      setUploading(false);
    }
  };

  const vocalSourceLabel =
    vocalSources.find((v) => v.value === form.vocalSource)?.label ?? form.vocalSource;

  const canGoNext = (currentStep: number) => {
    switch (currentStep) {
      case 0:
        return Boolean(form.title.trim());
      case 1:
        return Boolean(mediaFile && coverFile);
      case 2:
        return Boolean(
          form.lyricist.trim() &&
            form.vocalOwner.trim() &&
            form.rightsConfirm,
        );
      default:
        return true;
    }
  };

  if (authLoading) {
    return (
      <div className="container-page py-16 text-center text-muted">در حال بارگذاری...</div>
    );
  }

  if (!user) {
    return (
      <div className="container-page py-16 text-center text-muted">
        در حال انتقال به صفحه ورود...
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="section-title">ارسال اثر</h1>
      <p className="section-sub">
        فایل‌ها به‌صورت امن آپلود می‌شوند و پس از بررسی در سایت نمایش داده خواهند شد.
      </p>

      {!done && (
        <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
          {steps.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => !uploading && setStep(i)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm whitespace-nowrap",
                step === i
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-line text-muted",
              )}
            >
              {i + 1}. {label}
            </button>
          ))}
        </div>
      )}

      <div className="surface p-5 md:p-7">
        {!done && step === 0 && (
          <div className="space-y-4">
            <Field label="عنوان اثر *">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                className="field"
                placeholder="مثلاً: شب‌های تهران"
              />
            </Field>
            <Field label="نوع اثر *">
              <div className="flex gap-3">
                {["audio", "video"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => update("type", t)}
                    className={cn(
                      "flex-1 rounded-xl border py-3",
                      form.type === t
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line",
                    )}
                  >
                    {t === "audio" ? "صوتی" : "ویدئویی"}
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="ژانر / سبک">
                <select
                  value={form.genre}
                  onChange={(e) => update("genre", e.target.value)}
                  className="field"
                >
                  {["پاپ", "رپ", "سنتی", "راک", "الکترونیک", "هیپ‌هاپ", "امبینت", "فیوژن"].map(
                    (g) => (
                      <option key={g}>{g}</option>
                    ),
                  )}
                </select>
              </Field>
              <Field label="زبان اثر">
                <select
                  value={form.language}
                  onChange={(e) => update("language", e.target.value)}
                  className="field"
                >
                  {["فارسی", "انگلیسی", "بدون کلام", "سایر"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {!done && step === 1 && (
          <div className="space-y-4">
            <Field label="آپلود فایل اصلی *">
              <input
                type="file"
                accept={form.type === "audio" ? "audio/*" : "video/*"}
                className="field"
                onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
              />
              {mediaFile && (
                <p className="mt-2 text-xs text-muted">فایل انتخاب‌شده: {mediaFile.name}</p>
              )}
            </Field>

            <Field
              label={
                form.type === "audio"
                  ? "عکس کاور آهنگ * (ترجیحاً مربع)"
                  : "عکس کاور موزیک‌ویدئو * (ترجیحاً ۱۶:۹)"
              }
            >
              <input
                type="file"
                accept="image/*"
                className="field"
                onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              />
              {coverFile && (
                <p className="mt-2 text-xs text-muted">کاور انتخاب‌شده: {coverFile.name}</p>
              )}
            </Field>

            {(uploading || progress > 0) && (
              <div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>پیشرفت آپلود</span>
                  <span>{progress}٪</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}
          </div>
        )}

        {!done && step === 2 && (
          <div className="space-y-4">
            <Field label="شاعر / ترانه‌سرا *">
              <input
                value={form.lyricist}
                onChange={(e) => update("lyricist", e.target.value)}
                className="field"
                placeholder="نام شاعر یا ترانه‌سرا"
              />
            </Field>
            <Field label="آهنگساز / ملودی‌ساز">
              <input
                value={form.composer}
                onChange={(e) => update("composer", e.target.value)}
                className="field"
                placeholder="نام آهنگساز"
              />
            </Field>
            <Field label="مالک صدای خواننده *">
              <input
                value={form.vocalOwner}
                onChange={(e) => update("vocalOwner", e.target.value)}
                className="field"
                placeholder="نام شخص یا استودیوی مالک وکال"
              />
            </Field>
            <Field label="منبع صدای خواننده *">
              <select
                value={form.vocalSource}
                onChange={(e) => update("vocalSource", e.target.value)}
                className="field"
              >
                {vocalSources.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex items-start gap-3 rounded-xl border border-line bg-bg-soft p-4 text-sm">
              <input
                type="checkbox"
                className="mt-1 accent-[var(--accent)]"
                checked={form.rightsConfirm}
                onChange={(e) => update("rightsConfirm", e.target.checked)}
              />
              <span className="text-muted">
                تأیید می‌کنم که حقوق شعر، ملودی، صدا و تصویر این اثر متعلق به من است یا مجوز
                استفاده دارم.
              </span>
            </label>
          </div>
        )}

        {!done && step === 3 && (
          <div className="space-y-4">
            <Field label="متن ترانه / Lyrics">
              <textarea
                value={form.lyrics}
                onChange={(e) => update("lyrics", e.target.value)}
                className="field min-h-28"
              />
            </Field>
            <Field label="ابزارهای هوش مصنوعی">
              <input
                value={form.aiTools}
                onChange={(e) => update("aiTools", e.target.value)}
                className="field"
                placeholder="Suno, Runway, ..."
              />
            </Field>
            <Field label="پرامپت استفاده شده (اختیاری)">
              <textarea
                value={form.prompt}
                onChange={(e) => update("prompt", e.target.value)}
                className="field min-h-20"
              />
            </Field>
            <Field label="توضیحات سازنده">
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                className="field min-h-20"
              />
            </Field>
            <Field label="ارسال برای مسابقه">
              <select
                value={form.competitionId}
                onChange={(e) => update("competitionId", e.target.value)}
                className="field"
              >
                <option value="">بدون مسابقه</option>
                {competitions
                  .filter((c) => c.status === "active")
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
              </select>
            </Field>
          </div>
        )}

        {!done && step === 4 && (
          <div className="space-y-3 text-sm">
            <Row label="عنوان" value={form.title || "—"} />
            <Row label="نوع" value={form.type === "audio" ? "صوتی" : "ویدئویی"} />
            <Row label="ژانر" value={form.genre} />
            <Row label="فایل اثر" value={mediaFile ? "آماده ارسال" : "انتخاب نشده"} />
            <Row label="کاور" value={coverFile ? "آماده ارسال" : "انتخاب نشده"} />
            <Row label="شاعر" value={form.lyricist || "—"} />
            <Row label="آهنگساز" value={form.composer || "—"} />
            <Row label="مالک صدا" value={form.vocalOwner || "—"} />
            <Row label="منبع صدا" value={vocalSourceLabel} />
            <Row label="تأیید حقوق" value={form.rightsConfirm ? "بله" : "خیر"} />

            {(uploading || progress > 0) && (
              <div className="pt-2">
                <div className="mb-2 flex justify-between text-sm">
                  <span>پیشرفت ارسال</span>
                  <span>{progress}٪</span>
                </div>
                <div className="progress-bar">
                  <span style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {error && <p className="rounded-xl bg-danger/15 p-4 text-danger">{error}</p>}

            <button
              type="button"
              className="btn btn-primary mt-4"
              disabled={
                uploading ||
                !form.title ||
                !form.lyricist ||
                !form.vocalOwner ||
                !form.rightsConfirm ||
                !mediaFile ||
                !coverFile
              }
              onClick={() => void submitUpload()}
            >
              {uploading ? "در حال ارسال..." : "ارسال نهایی"}
            </button>
          </div>
        )}

        {done && (
          <div className="space-y-4 text-sm">
            <p className="rounded-xl bg-success/15 p-4 text-success">
              اثر با موفقیت ارسال شد و در صف بررسی قرار گرفت.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard" className="btn btn-primary">
                مشاهده آثار من
              </Link>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => router.push("/upload")}
              >
                ارسال اثر جدید
              </button>
            </div>
          </div>
        )}

        {!done && (
          <div className="mt-8 flex justify-between gap-3 border-t border-line pt-5">
            {step > 0 ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={uploading}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                قبلی
              </button>
            ) : (
              <span />
            )}
            {step < steps.length - 1 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={uploading || !canGoNext(step)}
                onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
              >
                مرحله بعد
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-2">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="text-left font-medium">{value}</span>
    </div>
  );
}
