/** مسیرهایی که بدون لاگین نباید باز شوند */
export const AUTH_REQUIRED_PREFIXES = [
  "/upload",
  "/dashboard",
  "/profile",
  "/admin",
] as const;

export function requiresAuth(pathname: string) {
  return AUTH_REQUIRED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** فقط مسیر نسبی امن داخل سایت */
export function safeNextPath(next: string | null | undefined, fallback = "/dashboard") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  return next;
}

export function loginUrl(next?: string) {
  const path = safeNextPath(next, "");
  if (!path) return "/login";
  return `/login?next=${encodeURIComponent(path)}`;
}
