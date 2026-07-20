"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { displayName, useAuth } from "@/components/auth/AuthProvider";
import {
  ads,
  competitions,
  formatNumber,
} from "@/data/mock";
import type { AdminTrack } from "@/lib/tracks";
import { cn, statusLabel } from "@/lib/utils";

const tabs = [
  { id: "tracks", label: "تایید آثار" },
  { id: "competitions", label: "مسابقات" },
  { id: "ads", label: "تبلیغات" },
  { id: "users", label: "کاربران" },
] as const;

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("tracks");
  const [tracks, setTracks] = useState<AdminTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    let cancelled = false;
    setTracksLoading(true);
    fetch("/api/admin/tracks")
      .then((r) => r.json())
      .then((data: { ok?: boolean; tracks?: AdminTrack[] }) => {
        if (!cancelled && data.ok && data.tracks) setTracks(data.tracks);
      })
      .finally(() => {
        if (!cancelled) setTracksLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const pendingCount = useMemo(
    () => tracks.filter((t) => t.status === "pending").length,
    [tracks],
  );

  async function updateTrackStatus(id: string, status: "approved" | "rejected") {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/tracks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok?: boolean };
      if (data.ok) {
        setTracks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t)),
        );
      }
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="container-page py-16 text-center text-muted">
        در حال بررسی دسترسی مدیریت...
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">پنل مدیریت</h1>
          <p className="section-sub mb-0">
            مدیر: {displayName(user)} · {user.phone}
          </p>
        </div>
        <span className="badge">{pendingCount} اثر در انتظار</span>
        <Link href="/dashboard" className="btn btn-ghost text-sm">
          داشبورد
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm",
              tab === t.id
                ? "border-accent bg-accent-soft text-accent"
                : "border-line text-muted",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tracks" && (
        <div className="space-y-3">
          {tracksLoading && (
            <p className="text-sm text-muted">در حال بارگذاری آثار...</p>
          )}
          {!tracksLoading && tracks.length === 0 && (
            <p className="text-sm text-muted">هنوز اثری ثبت نشده است.</p>
          )}
          {tracks.map((t) => (
            <div key={t.id} className="surface flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt="" className="size-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.artistName} · {t.type === "audio" ? "صوت" : "ویدئو"} · {t.createdAt}
                </p>
              </div>
              <span className="badge">{statusLabel(t.status)}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 text-xs text-success"
                  disabled={updatingId === t.id}
                  onClick={() => updateTrackStatus(t.id, "approved")}
                >
                  تایید
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 text-xs text-danger"
                  disabled={updatingId === t.id}
                  onClick={() => updateTrackStatus(t.id, "rejected")}
                >
                  رد
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "competitions" && (
        <div className="space-y-3">
          {competitions.map((c) => (
            <div key={c.id} className="surface p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{c.title}</h2>
                  <p className="mt-1 text-sm text-muted">{c.description}</p>
                </div>
                <span className="badge">{statusLabel(c.status)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted">
                <span>مهلت: {c.deadline}</span>
                <span>{formatNumber(c.entriesCount)} اثر</span>
                <span>{c.prize}</span>
              </div>
            </div>
          ))}
          <button type="button" className="btn btn-primary mt-2">
            تعریف مسابقه جدید (دمو)
          </button>
        </div>
      )}

      {tab === "ads" && (
        <div className="space-y-3">
          {ads.map((ad) => (
            <div key={ad.id} className="surface overflow-hidden md:flex">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ad.image} alt="" className="h-28 w-full object-cover md:w-56" />
              <div className="flex flex-1 items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-bold">{ad.title}</p>
                  <p className="text-sm text-muted">جایگاه: {ad.placement}</p>
                </div>
                <button type="button" className="btn btn-ghost text-sm">
                  ویرایش
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "users" && (
        <div className="surface overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="p-3 text-right font-medium">کاربر</th>
                <th className="p-3 text-right font-medium">موبایل</th>
                <th className="p-3 text-right font-medium">نقش</th>
                <th className="p-3 text-right font-medium">عضویت</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-line">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-full bg-accent-soft text-sm text-accent">
                      {displayName(user).slice(0, 1)}
                    </span>
                    {displayName(user)}
                  </div>
                </td>
                <td className="p-3" dir="ltr">
                  {user.phone}
                </td>
                <td className="p-3">{user.role}</td>
                <td className="p-3">—</td>
              </tr>
              <tr className="border-b border-line">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/avatars/a1.jpg"
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                    نیکا رضایی
                  </div>
                </td>
                <td className="p-3">0912***1122</td>
                <td className="p-3">user</td>
                <td className="p-3">۱۴۰۴/۱۱/۰۳</td>
              </tr>
              <tr>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/avatars/a3.jpg"
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                    سارا مهرگان
                  </div>
                </td>
                <td className="p-3">0935***4410</td>
                <td className="p-3">user</td>
                <td className="p-3">۱۴۰۴/۰۹/۲۱</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
