"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { loginUrl, requiresAuth } from "@/lib/auth-routes";

type Props = ComponentProps<typeof Link> & {
  /** اگر true باشد و کاربر لاگین نباشد، به صفحه ورود می‌رود */
  authRequired?: boolean;
};

/**
 * لینک معمولی؛ برای مسیرهای محافظت‌شده در صورت عدم لاگین به /login?next=... می‌رود.
 */
export function AuthLink({ href, authRequired, onClick, ...rest }: Props) {
  const { user, loading } = useAuth();
  const path = typeof href === "string" ? href : href.pathname || "/";
  const needAuth = authRequired ?? requiresAuth(path);
  const target =
    needAuth && !loading && !user ? loginUrl(path) : href;

  return <Link href={target} onClick={onClick} {...rest} />;
}
