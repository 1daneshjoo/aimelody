import type { Metadata } from "next";
import Link from "next/link";
import { competitions, formatNumber } from "@/data/mock";
import { statusLabel } from "@/lib/utils";

export const metadata: Metadata = { title: "مسابقات" };

export default function CompetitionsPage() {
  return (
    <div className="container-page py-10">
      <h1 className="section-title">مسابقات و چالش‌ها</h1>
      <p className="section-sub">چالش‌های تعریف‌شده توسط مدیر با رأی‌گیری مردمی زمان‌دار</p>

      <div className="grid gap-6">
        {competitions.map((c) => (
          <Link
            key={c.id}
            href={`/competitions/${c.id}`}
            className="surface grid overflow-hidden md:grid-cols-[320px_1fr]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.cover} alt={c.title} className="h-48 w-full object-cover md:h-full" />
            <div className="p-5 md:p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="badge">{statusLabel(c.status)}</span>
                <span className="badge">{formatNumber(c.entriesCount)} اثر</span>
              </div>
              <h2 className="font-display text-xl font-bold md:text-2xl">{c.title}</h2>
              <p className="mt-2 text-sm text-muted">{c.description}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted">
                <span>مهلت: {c.deadline}</span>
                <span>جایزه: {c.prize}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
