"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

/** بدون پروفایل کامل فقط این مسیرها مجازند */
const ALLOW_WITHOUT_PROFILE = ["/login", "/terms", "/about", "/profile/setup"];

/**
 * اگر نام یا آواتار ست نشده باشد، کاربر را به تکمیل پروفایل می‌فرستد.
 */
export function ProfileGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading || !user) return;
    if (user.profileComplete) return;
    const allowed = ALLOW_WITHOUT_PROFILE.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (!allowed) {
      router.replace("/profile/setup");
    }
  }, [loading, user, pathname, router]);

  return <>{children}</>;
}
