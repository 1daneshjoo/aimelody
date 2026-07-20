import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { execute, query } from "@/lib/db";
import { sendOtpSms } from "@/lib/ippanel";
import {
  generateOtpCode,
  hashOtp,
  normalizePhone,
  toE164Iran,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { phone?: string };
    const phone = normalizePhone(body.phone || "");
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: "شماره موبایل معتبر نیست (مثال: 0912xxxxxxx)" },
        { status: 400 },
      );
    }

    const code = generateOtpCode();
    const codeHash = hashOtp(phone, code);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // باطل کردن کدهای باز قبلی
    await execute(
      `UPDATE otp_codes SET consumed_at = UTC_TIMESTAMP()
       WHERE phone = :phone AND consumed_at IS NULL`,
      { phone },
    );

    await execute(
      `INSERT INTO otp_codes (phone, code_hash, expires_at)
       VALUES (:phone, :codeHash, :expiresAt)`,
      { phone, codeHash, expiresAt },
    );

    // کاربر را در صورت نبود ایجاد کن (نیمه‌عضویت تا verify)
    const existing = await query<RowDataPacket[]>(
      `SELECT id FROM users WHERE phone = :phone LIMIT 1`,
      { phone },
    );
    if (existing.length === 0) {
      const result = await execute(`INSERT INTO users (phone, role) VALUES (:phone, 'user')`, {
        phone,
      });
      const newId = Number(result.insertId);
      await execute(
        `UPDATE users SET public_id = CONCAT('a', id) WHERE id = :id AND (public_id IS NULL OR public_id = '')`,
        { id: newId },
      );
    }

    // اگر خط ارسال تنظیم نشده، مستقیم حالت توسعه (بدون درخواست شبکه به IPPanel)
    const from = process.env.IPPANEL_FROM?.trim();
    if (!from && process.env.OTP_DEV_FALLBACK === "true") {
      console.warn("[OTP_DEV_FALLBACK]", phone, code, "IPPANEL_FROM خالی است");
      return NextResponse.json({
        ok: true,
        demo: true,
        message: "حالت توسعه: کد در ترمینال سرور چاپ شد (خط SMS تنظیم نشده).",
      });
    }

    const message = `کد ورود AiMelody: ${code}\nاین کد تا ۵ دقیقه معتبر است.`;
    const sms = await sendOtpSms(toE164Iran(phone), message);

    if (!sms.ok) {
      const fallback = process.env.OTP_DEV_FALLBACK === "true";
      if (fallback) {
        console.warn("[OTP_DEV_FALLBACK]", phone, code, sms.error);
        return NextResponse.json({
          ok: true,
          demo: true,
          message: "SMS ارسال نشد؛ کد در لاگ سرور ذخیره شد (حالت توسعه).",
          hint: sms.error,
        });
      }
      return NextResponse.json(
        { ok: false, error: `ارسال پیامک ناموفق: ${sms.error}` },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "کد تایید ارسال شد.",
    });
  } catch (e) {
    console.error("[otp/send]", e);
    const { formatDbError } = await import("@/lib/db");
    const formatted = formatDbError(e);
    return NextResponse.json(
      {
        ok: false,
        error: formatted.error,
        ...(process.env.NODE_ENV !== "production" ? { detail: formatted.detail } : {}),
      },
      { status: 500 },
    );
  }
}
