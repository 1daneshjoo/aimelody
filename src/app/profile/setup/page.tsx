"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { requestSignedUpload, uploadToSignedUrl } from "@/lib/upload";
import { cn } from "@/lib/utils";

const PRESET_AVATARS = Array.from({ length: 12 }, (_, i) => `/images/avatars/a${i + 1}.jpg`);

export default function ProfileSetupPage() {
  const router = useRouter();
  const { user, loading, refresh } = useAuth();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(PRESET_AVATARS[0]);
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.avatarUrl) setAvatarUrl(user.avatarUrl);
  }, [user?.name, user?.avatarUrl]);

  if (loading) {
    return (
      <div className="container-page py-16 text-center text-muted">در حال بارگذاری...</div>
    );
  }

  if (!user) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted">برای تکمیل پروفایل ابتدا وارد شوید.</p>
        <a href="/login" className="btn btn-primary mt-4 inline-flex">
          ورود
        </a>
      </div>
    );
  }

  const onPickCustom = (file: File | null) => {
    setCustomFile(file);
    if (preview) URL.revokeObjectURL(preview);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      let finalAvatar = avatarUrl;

      if (customFile) {
        const signed = await requestSignedUpload({
          fileName: customFile.name,
          contentType: customFile.type || "image/jpeg",
          mediaType: "avatar",
          sizeBytes: customFile.size,
        });
        const uploaded = await uploadToSignedUrl(customFile, signed);
        finalAvatar = uploaded.publicUrl;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), avatarUrl: finalAvatar }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error || "ذخیره ناموفق بود");
        return;
      }
      await refresh();
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در ذخیره پروفایل");
    } finally {
      setSaving(false);
    }
  };

  const canSave = name.trim().length >= 2 && (Boolean(avatarUrl) || Boolean(customFile));

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="surface w-full max-w-lg p-6 md:p-8">
        <h1 className="text-center text-xl font-bold">تکمیل پروفایل</h1>
        <p className="mt-2 text-center text-sm text-muted">
          برای ادامه، نام نمایشی و آواتار الزامی است.
        </p>

        <div className="mt-8 space-y-6">
          <label className="block space-y-2 text-sm">
            <span className="text-muted">نام نمایشی *</span>
            <input
              className="field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: نیکا رضایی"
              disabled={saving}
              maxLength={120}
            />
          </label>

          <div className="space-y-3">
            <p className="text-sm text-muted">آواتار *</p>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
              {PRESET_AVATARS.map((src) => {
                const selected = !customFile && avatarUrl === src;
                return (
                  <button
                    key={src}
                    type="button"
                    onClick={() => {
                      onPickCustom(null);
                      setAvatarUrl(src);
                    }}
                    className={cn(
                      "overflow-hidden rounded-full border-2 p-0.5",
                      selected ? "border-accent" : "border-transparent",
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="aspect-square w-full rounded-full object-cover" />
                  </button>
                );
              })}
            </div>

            <label className="block space-y-2 text-sm">
              <span className="text-muted">یا آپلود عکس خودتان</span>
              <input
                type="file"
                accept="image/*"
                className="field"
                disabled={saving}
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onPickCustom(file);
                }}
              />
            </label>

            {(preview || avatarUrl) && (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-bg-soft p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={preview || avatarUrl}
                  alt=""
                  className="size-14 rounded-full object-cover"
                />
                <p className="text-sm text-muted">
                  {customFile ? "عکس سفارشی انتخاب شد" : "آواتار پیش‌فرض انتخاب شد"}
                </p>
              </div>
            )}
          </div>

          {error && <p className="rounded-xl bg-danger/15 p-3 text-sm text-danger">{error}</p>}

          <button
            type="button"
            className="btn btn-primary w-full"
            disabled={saving || !canSave}
            onClick={() => void save()}
          >
            {saving ? "در حال ذخیره..." : "ذخیره و ادامه"}
          </button>
        </div>
      </div>
    </div>
  );
}
