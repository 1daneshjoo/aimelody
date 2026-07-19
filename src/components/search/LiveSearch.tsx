"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { searchCatalog } from "@/data/mock";

export function LiveSearch({ compact = false }: { compact?: boolean }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const deferred = useMemo(() => q.trim(), [q]);
  const results = useMemo(() => searchCatalog(deferred), [deferred]);
  const hasHits =
    results.tracks.length + results.artists.length + results.genres.length > 0;

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={rootRef} className={compact ? "relative w-full" : "relative hidden sm:block"}>
      <div className="flex items-center gap-2 rounded-full border border-line bg-bg-soft px-3 py-1.5">
        <Search size={15} className="shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="جستجوی آهنگ، هنرمند، ژانر..."
          className="w-40 bg-transparent text-sm outline-none md:w-56"
        />
      </div>

      {open && deferred && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-bg-elevated p-3 shadow-xl">
          {!hasHits && <p className="px-2 py-3 text-sm text-muted">نتیجه‌ای پیدا نشد.</p>}

          {results.artists.length > 0 && (
            <Section title="هنرمندان">
              {results.artists.map((a) => (
                <Link
                  key={a.id}
                  href={`/artist/${a.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-bg-hover"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.avatar} alt="" className="size-8 rounded-full object-cover" />
                  <span className="text-sm font-medium">{a.name}</span>
                </Link>
              ))}
            </Section>
          )}

          {results.genres.length > 0 && (
            <Section title="ژانرها">
              {results.genres.map((g) => (
                <Link
                  key={g}
                  href={`/explore?genre=${encodeURIComponent(g)}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-2 py-2 text-sm hover:bg-bg-hover"
                >
                  {g}
                </Link>
              ))}
            </Section>
          )}

          {results.tracks.length > 0 && (
            <Section title="آثار">
              {results.tracks.map((t) => (
                <Link
                  key={t.id}
                  href={`/track/${t.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-2 py-2 hover:bg-bg-hover"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.cover} alt="" className="size-8 rounded-lg object-cover" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t.title}</span>
                    <span className="block truncate text-xs text-muted">{t.artist.name}</span>
                  </span>
                </Link>
              ))}
            </Section>
          )}

          <Link
            href={`/explore?q=${encodeURIComponent(deferred)}`}
            onClick={() => setOpen(false)}
            className="mt-2 block rounded-xl bg-accent-soft px-3 py-2 text-center text-sm text-accent"
          >
            مشاهده همه نتایج
          </Link>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="px-2 pb-1 text-xs font-bold text-muted">{title}</p>
      {children}
    </div>
  );
}
