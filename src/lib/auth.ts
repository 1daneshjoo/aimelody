import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

const COOKIE = "aimelody_session";

function secretKey() {
  return new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");
}

export type SessionUser = {
  id: number;
  phone: string;
  role: "user" | "admin";
  name?: string | null;
  avatarUrl?: string | null;
};

export function isProfileComplete(user: {
  name?: string | null;
  avatarUrl?: string | null;
}) {
  return Boolean(user.name?.trim() && user.avatarUrl?.trim());
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    phone: user.phone,
    role: user.role,
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const id = Number(payload.sub);
    if (!id) return null;
    return {
      id,
      phone: String(payload.phone || ""),
      role: payload.role === "admin" ? "admin" : "user",
      name: (payload.name as string | null) ?? null,
      avatarUrl: (payload.avatarUrl as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

export async function readSession(req: NextRequest): Promise<SessionUser | null> {
  return verifySessionToken(req.cookies.get(COOKIE)?.value);
}

/** سشن برای Server Components / صفحات RSC */
export async function getServerSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export { COOKIE as SESSION_COOKIE };
