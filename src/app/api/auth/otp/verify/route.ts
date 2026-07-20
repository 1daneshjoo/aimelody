import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth";
import { execute, query } from "@/lib/db";
import { hashOtp, normalizePhone, safeEqual } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string; code?: string };
    const phone = normalizePhone(body.phone || "");
    const code = (body.code || "").trim();

    if (!phone || !/^\d{4,8}$/.test(code)) {
      return NextResponse.json(
        { ok: false, error: "شماره یا کد تایید نامعتبر است" },
        { status: 400 },
      );
    }

    const rows = await query<
      (RowDataPacket & {
        id: number;
        code_hash: string;
        expires_at: Date;
        attempts: number;
      })[]
    >(
      `SELECT id, code_hash, expires_at, attempts
       FROM otp_codes
       WHERE phone = :phone AND consumed_at IS NULL
       ORDER BY id DESC
       LIMIT 1`,
      { phone },
    );

    const otp = rows[0];
    if (!otp) {
      return NextResponse.json({ ok: false, error: "کد فعالی یافت نشد" }, { status: 400 });
    }

    if (otp.attempts >= 5) {
      return NextResponse.json(
        { ok: false, error: "تعداد تلاش بیش از حد. کد جدید بگیرید." },
        { status: 429 },
      );
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, error: "کد منقضی شده است" }, { status: 400 });
    }

    const expected = hashOtp(phone, code);
    const ok = safeEqual(expected, otp.code_hash);
    await execute(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = :id`, {
      id: otp.id,
    });

    if (!ok) {
      return NextResponse.json({ ok: false, error: "کد نادرست است" }, { status: 400 });
    }

    await execute(`UPDATE otp_codes SET consumed_at = UTC_TIMESTAMP() WHERE id = :id`, {
      id: otp.id,
    });

    const users = await query<
      (RowDataPacket & {
        id: number;
        phone: string;
        role: "user" | "admin";
        name: string | null;
        avatar_url: string | null;
      })[]
    >(`SELECT id, phone, role, name, avatar_url FROM users WHERE phone = :phone LIMIT 1`, {
      phone,
    });

    let userId = users[0]?.id;
    let userRole: "user" | "admin" = users[0]?.role ?? "user";
    let userName: string | null = users[0]?.name ?? null;
    let avatarUrl: string | null = users[0]?.avatar_url ?? null;

    if (!userId) {
      const result = await execute(
        `INSERT INTO users (phone, role) VALUES (:phone, 'user')`,
        { phone },
      );
      userId = Number(result.insertId);
      userRole = "user";
      userName = null;
      avatarUrl = null;
    }

    await execute(
      `UPDATE users SET public_id = CONCAT('a', id) WHERE id = :id AND (public_id IS NULL OR public_id = '')`,
      { id: userId },
    );

    const token = await createSessionToken({
      id: userId,
      phone,
      role: userRole,
      name: userName,
      avatarUrl,
    });

    const profileComplete = Boolean(userName?.trim() && avatarUrl?.trim());

    const res = NextResponse.json({
      ok: true,
      user: {
        id: userId,
        phone,
        role: userRole,
        name: userName,
        avatarUrl,
        profileComplete,
      },
    });
    const cookie = sessionCookieOptions(token);
    res.cookies.set(cookie);
    return res;
  } catch (e) {
    console.error("[otp/verify]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور" },
      { status: 500 },
    );
  }
}
