"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, Trophy, Upload, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/explore", label: "اکتشاف", icon: Compass },
  { href: "/upload", label: "آپلود", icon: Upload },
  { href: "/competitions", label: "مسابقه", icon: Trophy },
  { href: "/dashboard", label: "من", icon: User },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--bg)_92%,transparent)] backdrop-blur-xl md:hidden">
      <ul className="container-page grid grid-cols-5 gap-1 py-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href}>
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
