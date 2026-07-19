"use client";

import { useMemo, useState } from "react";
import {
  ads,
  competitions,
  currentUser,
  formatNumber,
  tracks,
} from "@/data/mock";
import { cn, statusLabel } from "@/lib/utils";

const tabs = [
  { id: "tracks", label: "تایید آثار" },
  { id: "competitions", label: "مسابقات" },
  { id: "ads", label: "تبلیغات" },
  { id: "users", label: "کاربران" },
] as const;

export default function AdminPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("tracks");
  const [statuses, setStatuses] = useState<Record<string, string>>(
    Object.fromEntries(tracks.map((t) => [t.id, t.status])),
  );

  const pendingCount = useMemo(
    () => Object.values(statuses).filter((s) => s === "pending").length,
    [statuses],
  );

  return (
    <div className="container-page py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="section-title">پنل مدیریت</h1>
          <p className="section-sub mb-0">
            تایید آثار، مسابقات، تبلیغات و کاربران — داده دمو
          </p>
        </div>
        <span className="badge">{pendingCount} اثر در انتظار</span>
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
          {tracks.map((t) => (
            <div key={t.id} className="surface flex flex-wrap items-center gap-4 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={t.cover} alt="" className="size-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{t.title}</p>
                <p className="text-sm text-muted">
                  {t.artist.name} · {t.type === "audio" ? "صوت" : "ویدئو"} · {t.createdAt}
                </p>
              </div>
              <span className="badge">{statusLabel(statuses[t.id])}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 text-xs text-success"
                  onClick={() => setStatuses((s) => ({ ...s, [t.id]: "approved" }))}
                >
                  تایید
                </button>
                <button
                  type="button"
                  className="btn btn-ghost !py-1.5 text-xs text-danger"
                  onClick={() => setStatuses((s) => ({ ...s, [t.id]: "rejected" }))}
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
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentUser.avatar}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                    {currentUser.name}
                  </div>
                </td>
                <td className="p-3">{currentUser.phone}</td>
                <td className="p-3">{currentUser.role}</td>
                <td className="p-3">{currentUser.joinedAt}</td>
              </tr>
              <tr className="border-b border-line">
                <td className="p-3">نیکا رضایی</td>
                <td className="p-3">0912***1122</td>
                <td className="p-3">user</td>
                <td className="p-3">۱۴۰۴/۱۱/۰۳</td>
              </tr>
              <tr>
                <td className="p-3">سارا مهرگان</td>
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
