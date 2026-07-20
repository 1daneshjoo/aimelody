"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn, Menu, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AuthLink } from "@/components/auth/AuthLink";
import { displayName, useAuth } from "@/components/auth/AuthProvider";
import { LiveSearch } from "@/components/search/LiveSearch";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "خانه" },
  { href: "/explore", label: "آرشیو" },
  { href: "/competitions", label: "مسابقات" },
  { href: "/upload", label: "آپلود اثر" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link href="/" className="shrink-0 font-display text-xl font-bold tracking-tight">
          Ai<span className="text-accent">Melody</span>
          <span className="text-muted text-sm font-normal">.ir</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <AuthLink
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
            </AuthLink>
          ))}
        </nav>

        <div className="flex min-w-0 items-center gap-2">
          <LiveSearch />
          <ThemeToggle />
          <AuthLink href="/upload" className="btn btn-primary !px-3 !py-2 text-sm">
            <Upload size={15} />
            <span className="hidden sm:inline">ارسال اثر</span>
          </AuthLink>

          {!loading && user ? (
            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-full border border-line py-1 pr-1 pl-3 sm:flex"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <span className="size-8 rounded-full bg-accent-soft text-center text-sm leading-8 text-accent">
                  {displayName(user).slice(0, 1)}
                </span>
              )}
              <span className="max-w-24 truncate text-sm">{displayName(user)}</span>
            </Link>
          ) : !loading ? (
            <Link href="/login" className="btn btn-ghost hidden !px-3 !py-2 text-sm sm:inline-flex">
              <LogIn size={15} />
              ورود
            </Link>
          ) : null}

          <button
            type="button"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-text transition hover:bg-bg-hover lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "بستن منو" : "باز کردن منو"}
            aria-expanded={open}
            aria-controls="mobile-menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open ? (
        <div className="lg:hidden">
          <button
            type="button"
            className="fixed inset-0 top-16 z-[60] bg-black/45"
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
          />
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-full z-[70] max-h-[min(70vh,calc(100dvh-4rem))] overflow-y-auto border-b border-line bg-bg shadow-lg"
          >
            <div className="container-page space-y-3 py-4">
              <LiveSearch compact />
              <nav className="flex flex-col gap-1">
                {links.map((link) => (
                  <AuthLink
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-xl px-3 py-3 text-base",
                      pathname === link.href ? "bg-accent-soft text-accent" : "text-text",
                    )}
                  >
                    {link.label}
                  </AuthLink>
                ))}

                {user ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="rounded-xl px-3 py-3 text-text"
                    >
                      داشبورد من
                    </Link>
                    {user.role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setOpen(false)}
                        className="rounded-xl px-3 py-3 text-text"
                      >
                        پنل مدیریت
                      </Link>
                    )}
                    <button
                      type="button"
                      className="rounded-xl px-3 py-3 text-right text-muted"
                      onClick={() => {
                        setOpen(false);
                        void logout();
                      }}
                    >
                      خروج
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-3 py-3 text-text"
                  >
                    ورود / ثبت‌نام
                  </Link>
                )}
              </nav>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
