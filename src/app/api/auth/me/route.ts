import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import { isProfileComplete, readSession, type SessionUser } from "@/lib/auth";
import { query } from "@/lib/db";

export const runtime = "nodejs";

async function loadUser(id: number): Promise<SessionUser | null> {
  const rows = await query<
    (RowDataPacket & {
      id: number;
      phone: string;
      role: "user" | "admin";
      name: string | null;
      avatar_url: string | null;
    })[]
  >(`SELECT id, phone, role, name, avatar_url FROM users WHERE id = :id LIMIT 1`, { id });

  const row = rows[0];
  if (!row) return null;
  return {
    id: row.id,
    phone: row.phone,
    role: row.role === "admin" ? "admin" : "user",
    name: row.name,
    avatarUrl: row.avatar_url,
  };
}

export async function GET(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: true, user: null });
    }

    const user = (await loadUser(session.id)) || session;
    return NextResponse.json({
      ok: true,
      user: {
        ...user,
        profileComplete: isProfileComplete(user),
      },
    });
  } catch (e) {
    console.error("[auth/me]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور", user: null },
      { status: 500 },
    );
  }
}
