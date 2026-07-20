"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUrl, requiresAuth } from "@/lib/auth-routes";

/**
 * اگر کاربر لاگین نباشد و مسیر نیاز به احراز هویت داشته باشد،
 * به /login?next=... هدایت می‌شود.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (!requiresAuth(pathname)) return;
    router.replace(loginUrl(pathname));
  }, [loading, user, pathname, router]);

  return <>{children}</>;
}
