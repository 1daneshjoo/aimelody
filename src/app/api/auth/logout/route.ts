import { NextResponse } from "next/server";
import { clearSessionCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  const cookie = clearSessionCookieOptions();
  res.cookies.set(cookie);
  return res;
}
