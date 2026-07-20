"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, LogIn, Trophy, Upload, User } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const items = [
    { href: "/", label: "خانه", icon: Home },
    { href: "/explore", label: "آرشیو", icon: Compass },
    { href: "/upload", label: "آپلود", icon: Upload },
    { href: "/competitions", label: "مسابقه", icon: Trophy },
    user || loading
      ? { href: "/dashboard", label: "من", icon: User }
      : { href: "/login", label: "ورود", icon: LogIn },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur-xl md:hidden">
      <ul className="container-page grid grid-cols-5 gap-1 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href + label}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px]",
                  active ? "bg-accent-soft text-accent" : "text-muted",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
