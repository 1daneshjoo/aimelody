import { SignJWT, jwtVerify } from "jose";
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
};

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    phone: user.phone,
    role: user.role,
    name: user.name ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function readSession(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE)?.value;
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
    };
  } catch {
    return null;
  }
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

export { COOKIE as SESSION_COOKIE };
