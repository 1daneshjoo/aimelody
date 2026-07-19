"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Upload, X } from "lucide-react";
import { useState } from "react";
import { currentUser } from "@/data/mock";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "خانه" },
  { href: "/explore", label: "اکتشاف و چارت" },
  { href: "/competitions", label: "مسابقات" },
  { href: "/upload", label: "آپلود اثر" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[color-mix(in_oklab,var(--bg)_82%,transparent)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl font-bold tracking-tight">
          Ai<span className="text-accent">Melody</span>
          <span className="text-muted text-sm font-normal">.ir</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition",
                pathname === link.href
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:text-text",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/explore"
            className="btn btn-ghost hidden !px-3 sm:inline-flex"
            aria-label="جستجو"
          >
            <Search size={16} />
          </Link>
          <Link href="/upload" className="btn btn-primary !py-2 text-sm">
            <Upload size={15} />
            <span className="hidden sm:inline">ارسال اثر</span>
          </Link>
          <Link
            href="/dashboard"
            className="hidden items-center gap-2 rounded-full border border-line py-1 pr-1 pl-3 sm:flex"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="size-8 rounded-full object-cover"
            />
            <span className="text-sm">{currentUser.name.split(" ")[0]}</span>
          </Link>
          <button
            type="button"
            className="btn btn-ghost !px-3 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="منو"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line lg:hidden">
          <nav className="container-page flex flex-col gap-1 py-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-xl px-3 py-2.5",
                  pathname === link.href ? "bg-accent-soft text-accent" : "text-muted",
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-muted"
            >
              داشبورد من
            </Link>
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-muted"
            >
              پنل مدیریت
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-muted"
            >
              ورود / ثبت‌نام
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
