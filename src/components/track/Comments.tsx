"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUrl } from "@/lib/auth-routes";
import { formatNumber } from "@/lib/catalog";
import type { Comment } from "@/types";

export function Comments({
  trackId,
  items: initialItems,
}: {
  trackId: string;
  items: Comment[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuth();
  const [items, setItems] = useState(initialItems);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authLoading) return;
    if (!user) {
      router.push(loginUrl(pathname));
      return;
    }

    const text = body.trim();
    if (text.length < 2) {
      setError("نظر کوتاه است");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/tracks/${encodeURIComponent(trackId)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        comment?: Comment;
      };
      if (!res.ok || !data.ok || !data.comment) {
        if (res.status === 401) {
          router.push(loginUrl(pathname));
          return;
        }
        setError(data.error || "ارسال نظر ناموفق بود");
        return;
      }
      setItems((prev) => [data.comment!, ...prev]);
      setBody("");
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="surface p-5 md:p-6">
      <h2 className="section-title text-xl">نظرات</h2>
      <p className="section-sub text-sm">{formatNumber(items.length)} دیدگاه</p>
      <div className="space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-muted">هنوز نظری ثبت نشده است.</p>
        )}
        {items.map((c) => (
          <article key={c.id} className="flex gap-3 border-b border-line pb-4 last:border-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.avatar} alt={c.userName} className="size-10 rounded-full object-cover" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm">{c.userName}</strong>
                <span className="text-xs text-muted">{c.createdAt}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{c.body}</p>
            </div>
          </article>
        ))}
      </div>
      <form className="mt-5 space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <textarea
          className="min-h-24 w-full rounded-xl border border-line bg-bg-soft px-3 py-2 outline-none focus:border-accent"
          placeholder="نظر خود را بنویسید..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button type="submit" className="btn btn-ghost" disabled={saving}>
          {saving ? "در حال ارسال..." : "ارسال نظر"}
        </button>
      </form>
    </div>
  );
}
