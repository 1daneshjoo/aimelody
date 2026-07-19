"use client";

import type { Comment } from "@/types";

export function Comments({ items }: { items: Comment[] }) {
  return (
    <div className="surface p-5 md:p-6">
      <h2 className="section-title text-xl">نظرات</h2>
      <p className="section-sub text-sm">{items.length} دیدگاه</p>
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
      <form
        className="mt-5 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <textarea
          className="min-h-24 w-full rounded-xl border border-line bg-bg-soft px-3 py-2 outline-none focus:border-accent"
          placeholder="نظر خود را بنویسید... (دمو)"
        />
        <button type="submit" className="btn btn-ghost">
          ارسال نظر
        </button>
      </form>
    </div>
  );
}
