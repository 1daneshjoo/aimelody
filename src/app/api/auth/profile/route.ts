import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { RowDataPacket } from "mysql2";
import {
  createSessionToken,
  isProfileComplete,
  readSession,
  sessionCookieOptions,
} from "@/lib/auth";
import { execute, query } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const body = (await req.json()) as {
      name?: string;
      avatarUrl?: string;
      bio?: string;
    };

    const name = (body.name || "").trim();
    const avatarUrl = (body.avatarUrl || "").trim();
    const bio = (body.bio || "").trim();

    if (name.length < 2 || name.length > 120) {
      return NextResponse.json(
        { ok: false, error: "نام نمایشی باید بین ۲ تا ۱۲۰ کاراکتر باشد" },
        { status: 400 },
      );
    }

    if (!avatarUrl) {
      return NextResponse.json({ ok: false, error: "انتخاب آواتار الزامی است" }, { status: 400 });
    }

    // فقط مسیرهای خودمان یا CDN عمومی سایت
    const allowed =
      avatarUrl.startsWith("/images/") ||
      avatarUrl.startsWith("/uploads/") ||
      avatarUrl.startsWith("https://dl.aimelody.ir/") ||
      (process.env.DL_BASE_URL && avatarUrl.startsWith(process.env.DL_BASE_URL)) ||
      (process.env.NEXT_PUBLIC_DL_BASE_URL &&
        avatarUrl.startsWith(process.env.NEXT_PUBLIC_DL_BASE_URL));

    if (!allowed) {
      return NextResponse.json({ ok: false, error: "آدرس آواتار نامعتبر است" }, { status: 400 });
    }

    await execute(
      `UPDATE users
       SET name = :name, avatar_url = :avatarUrl, bio = :bio
       WHERE id = :id`,
      { id: session.id, name, avatarUrl, bio: bio || null },
    );

    const rows = await query<
      (RowDataPacket & {
        id: number;
        phone: string;
        role: "user" | "admin";
        name: string | null;
        avatar_url: string | null;
      })[]
    >(`SELECT id, phone, role, name, avatar_url FROM users WHERE id = :id LIMIT 1`, {
      id: session.id,
    });

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ ok: false, error: "کاربر یافت نشد" }, { status: 404 });
    }

    const user = {
      id: row.id,
      phone: row.phone,
      role: (row.role === "admin" ? "admin" : "user") as "user" | "admin",
      name: row.name,
      avatarUrl: row.avatar_url,
    };

    const token = await createSessionToken(user);
    const res = NextResponse.json({
      ok: true,
      user: { ...user, profileComplete: isProfileComplete(user) },
    });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch (e) {
    console.error("[auth/profile]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور" },
      { status: 500 },
    );
  }
}
