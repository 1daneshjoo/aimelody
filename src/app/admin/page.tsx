"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { displayName, useAuth } from "@/components/auth/AuthProvider";
import {
  ads as mockAds,
  competitions as mockCompetitions,
  formatNumber,
} from "@/data/mock";
import type { AdminTrack } from "@/lib/tracks";
import { cn, statusLabel } from "@/lib/utils";
import type { AdBanner, Competition, UserProfile } from "@/types";

const tabs = [
  { id: "tracks", label: "تایید آثار" },
  { id: "competitions", label: "مسابقات" },
  { id: "ads", label: "تبلیغات" },
  { id: "users", label: "کاربران" },
] as const;

function statusTone(status: string) {
  if (status === "approved") return "border-success/40 bg-success/15 text-success";
  if (status === "rejected") return "border-danger/40 bg-danger/15 text-danger";
  if (status === "pending") return "border-accent/40 bg-accent-soft text-accent";
  return "border-line text-muted";
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("tracks");
  const [tracks, setTracks] = useState<AdminTrack[]>([]);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [ads, setAds] = useState<AdBanner[]>(mockAds);
  const [competitions, setCompetitions] = useState<Competition[]>(mockCompetitions);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

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

  const loadTracks = useCallback(async () => {
    setTracksLoading(true);
    try {
      const res = await fetch("/api/admin/tracks", { cache: "no-store" });
      const data = (await res.json()) as { ok?: boolean; tracks?: AdminTrack[]; error?: string };
      if (data.ok && data.tracks) setTracks(data.tracks);
      else setFlash({ type: "err", text: data.error || "بارگذاری آثار ناموفق بود" });
    } catch {
      setFlash({ type: "err", text: "خطای شبکه در بارگذاری آثار" });
    } finally {
      setTracksLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    void loadTracks();
    fetch("/api/admin/meta", { cache: "no-store" })
      .then((r) => r.json())
      .then(
        (data: {
          ok?: boolean;
          users?: UserProfile[];
          ads?: AdBanner[];
          competitions?: Competition[];
        }) => {
          if (!data.ok) return;
          if (data.users) setUsers(data.users);
          if (data.ads?.length) setAds(data.ads);
          if (data.competitions?.length) setCompetitions(data.competitions);
        },
      )
      .catch(() => undefined);
  }, [user, loadTracks]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 3500);
    return () => clearTimeout(t);
  }, [flash]);

  const pendingCount = useMemo(
    () => tracks.filter((t) => t.status === "pending").length,
    [tracks],
  );

  const visibleTracks = useMemo(() => {
    if (filter === "all") return tracks;
    return tracks.filter((t) => t.status === filter);
  }, [tracks, filter]);

  async function updateTrackStatus(id: string, status: "approved" | "rejected") {
    const prev = tracks;
    setUpdatingId(id);
    setFlash(null);
    // به‌روزرسانی فوری UI
    setTracks((list) => list.map((t) => (t.id === id ? { ...t, status } : t)));

    try {
      const res = await fetch(`/api/admin/tracks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; status?: string };
      if (!data.ok) {
        setTracks(prev);
        setFlash({ type: "err", text: data.error || "تغییر وضعیت ناموفق بود" });
        return;
      }
      setFlash({
        type: "ok",
        text: status === "approved" ? "اثر تایید شد و در آرشیو قرار گرفت." : "اثر رد شد.",
      });
      // همگام‌سازی با سرور
      void loadTracks();
    } catch {
      setTracks(prev);
      setFlash({ type: "err", text: "خطای شبکه — دوباره تلاش کنید" });
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

      {flash && (
        <div
          className={cn(
            "mb-4 rounded-xl border px-4 py-3 text-sm",
            flash.type === "ok"
              ? "border-success/40 bg-success/15 text-success"
              : "border-danger/40 bg-danger/15 text-danger",
          )}
        >
          {flash.text}
        </div>
      )}

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
          <div className="mb-2 flex flex-wrap gap-2">
            {(
              [
                ["pending", "در انتظار"],
                ["approved", "تاییدشده"],
                ["rejected", "ردشده"],
                ["all", "همه"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs",
                  filter === id
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-line text-muted",
                )}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              className="btn btn-ghost !py-1.5 text-xs"
              onClick={() => void loadTracks()}
              disabled={tracksLoading}
            >
              تازه‌سازی
            </button>
          </div>

          {tracksLoading && (
            <p className="text-sm text-muted">در حال بارگذاری آثار...</p>
          )}
          {!tracksLoading && visibleTracks.length === 0 && (
            <p className="text-sm text-muted">اثری در این فیلتر نیست.</p>
          )}
          {visibleTracks.map((t) => (
            <div
              key={`${t.id}-${t.status}`}
              className="surface flex flex-wrap items-center gap-4 p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt="" className="size-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.artistName} · {t.type === "audio" ? "صوت" : "ویدئو"} · {t.createdAt}
                </p>
                <Link href={`/track/${t.id}`} className="text-xs text-accent">
                  مشاهده اثر
                </Link>
              </div>
              <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", statusTone(t.status))}>
                {statusLabel(t.status)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 text-xs text-success"
                  disabled={updatingId === t.id || t.status === "approved"}
                  onClick={() => void updateTrackStatus(t.id, "approved")}
                >
                  {updatingId === t.id && t.status !== "approved" ? "..." : "تایید"}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 text-xs text-danger"
                  disabled={updatingId === t.id || t.status === "rejected"}
                  onClick={() => void updateTrackStatus(t.id, "rejected")}
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
                <th className="p-3 text-right font-medium">صفحه</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td className="p-3 text-muted" colSpan={5}>
                    کاربری یافت نشد.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-b border-line">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={u.avatar}
                        alt=""
                        className="size-8 rounded-full object-cover"
                      />
                      {u.name}
                    </div>
                  </td>
                  <td className="p-3" dir="ltr">
                    {u.phone}
                  </td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{u.joinedAt}</td>
                  <td className="p-3">
                    <Link href={`/artist/${u.id}`} className="text-accent">
                      /artist/{u.id}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
