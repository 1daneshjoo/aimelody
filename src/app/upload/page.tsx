"use client";

import { useState } from "react";
import { competitions } from "@/data/mock";
import { cn } from "@/lib/utils";

const steps = ["اطلاعات اثر", "فایل و کاور", "عوامل و حقوق", "جزئیات تکمیلی", "بازبینی"];

const vocalSources = [
  { value: "ai", label: "تولیدشده با هوش مصنوعی" },
  { value: "own", label: "صدای خودم / ضبط شخصی" },
  { value: "licensed", label: "لایسنس‌شده از شخص/استودیو دیگر" },
  { value: "other", label: "سایر" },
];

export default function UploadPage() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
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
    fileName: "",
    coverName: "",
    fileLink: "",
  });

  const update = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const simulateUpload = () => {
    setUploading(true);
    setProgress(0);
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setUploading(false);
          setDone(true);
          return 100;
        }
        return p + 8;
      });
    }, 180);
  };

  const vocalSourceLabel =
    vocalSources.find((v) => v.value === form.vocalSource)?.label ?? form.vocalSource;

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="section-title">ارسال اثر</h1>
      <p className="section-sub">فرم چندمرحله‌ای آجاکس با نوار پیشرفت — بدون رفرش صفحه</p>

      <div className="mb-8 flex gap-2 overflow-x-auto pb-1">
        {steps.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(i)}
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

      <div className="surface p-5 md:p-7">
        {step === 0 && (
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

        {step === 1 && (
          <div className="space-y-4">
            <Field label="آپلود فایل اصلی *">
              <input
                type="file"
                accept={form.type === "audio" ? "audio/*" : "video/*"}
                className="field"
                onChange={(e) => update("fileName", e.target.files?.[0]?.name ?? "")}
              />
              {form.fileName && <p className="mt-2 text-xs text-muted">{form.fileName}</p>}
            </Field>
            <Field label="یا لینک مستقیم فایل">
              <input
                value={form.fileLink}
                onChange={(e) => update("fileLink", e.target.value)}
                className="field"
                placeholder="https://..."
              />
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
                onChange={(e) => update("coverName", e.target.files?.[0]?.name ?? "")}
              />
              {form.coverName && <p className="mt-2 text-xs text-muted">{form.coverName}</p>}
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

        {step === 2 && (
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
                placeholder="نام آهنگساز (اگر با سازنده یکی است خالی بگذارید)"
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
                استفاده دارم و مسئولیت هرگونه نقض حقوق با من است.
              </span>
            </label>
          </div>
        )}

        {step === 3 && (
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

        {step === 4 && (
          <div className="space-y-3 text-sm">
            <Row label="عنوان" value={form.title || "—"} />
            <Row label="نوع" value={form.type === "audio" ? "صوتی" : "ویدئویی"} />
            <Row label="ژانر" value={form.genre} />
            <Row label="زبان" value={form.language} />
            <Row label="فایل" value={form.fileName || form.fileLink || "—"} />
            <Row label="کاور" value={form.coverName || "—"} />
            <Row label="شاعر" value={form.lyricist || "—"} />
            <Row label="آهنگساز" value={form.composer || "—"} />
            <Row label="مالک صدا" value={form.vocalOwner || "—"} />
            <Row label="منبع صدا" value={vocalSourceLabel} />
            <Row label="ابزارها" value={form.aiTools || "—"} />
            <Row label="تأیید حقوق" value={form.rightsConfirm ? "بله" : "خیر"} />
            {done ? (
              <p className="rounded-xl bg-success/15 p-4 text-success">
                اثر با موفقیت در صف بررسی مدیر قرار گرفت. (شبیه‌سازی دمو)
              </p>
            ) : (
              <button
                type="button"
                className="btn btn-primary mt-4"
                disabled={
                  uploading ||
                  !form.title ||
                  !form.lyricist ||
                  !form.vocalOwner ||
                  !form.rightsConfirm
                }
                onClick={simulateUpload}
              >
                {uploading ? "در حال ارسال..." : "ارسال نهایی"}
              </button>
            )}
          </div>
        )}

        <div className="mt-8 flex justify-between gap-3 border-t border-line pt-5">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            قبلی
          </button>
          {step < steps.length - 1 && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            >
              مرحله بعد
            </button>
          )}
        </div>
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
      <span className="text-muted">{label}</span>
      <span className="text-left font-medium">{value}</span>
    </div>
  );
}
