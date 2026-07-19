import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { storeUpload } from "@/lib/ftp";
import { verifyUploadToken } from "@/lib/security";

export const runtime = "nodejs";

/**
 * دریافت فایل با توکن امضاشده.
 * اولویت ذخیره: HTTPS روی dl → FTP → لوکال public/uploads
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const payload = verifyUploadToken(token);
    if (!payload) {
      return NextResponse.json(
        { ok: false, error: "توکن آپلود نامعتبر یا منقضی است" },
        { status: 401 },
      );
    }

    const bytes = Buffer.from(await req.arrayBuffer());
    if (!bytes.length) {
      return NextResponse.json({ ok: false, error: "فایل خالی است" }, { status: 400 });
    }

    const contentType = req.headers.get("content-type") || undefined;
    const stored = await storeUpload(payload.path, bytes, contentType);

    await execute(
      `UPDATE upload_tickets
       SET used_at = UTC_TIMESTAMP()
       WHERE user_id = :userId AND storage_path = :path AND used_at IS NULL`,
      { userId: payload.userId, path: payload.path },
    );

    // اگر لوکال ذخیره شد، public_url تیکت را به مسیر محلی آپدیت کن
    if (stored.via === "local" && stored.publicPathHint) {
      await execute(
        `UPDATE upload_tickets
         SET public_url = :publicUrl
         WHERE user_id = :userId AND storage_path = :path`,
        {
          userId: payload.userId,
          path: payload.path,
          publicUrl: stored.publicPathHint,
        },
      );
    }

    return NextResponse.json({
      ok: true,
      storedVia: stored.via,
      // فقط وقتی لوکال است فرانت می‌تواند همین را به‌عنوان آواتار ذخیره کند
      ...(stored.publicPathHint ? { localUrl: stored.publicPathHint } : {}),
    });
  } catch (e) {
    console.error("[uploads/put]", e);
    const msg = e instanceof Error ? e.message : "خطای سرور";
    const hint = /ETIMEDOUT|ECONNREFUSED|سی‌پنل|cPanel/i.test(msg)
      ? "آپلود از طریق سی‌پنل/شبکه ناموفق بود. DL_CPANEL_* را در .env.local چک کنید."
      : undefined;
    return NextResponse.json(
      { ok: false, error: msg, hint },
      { status: 500 },
    );
  }
}
