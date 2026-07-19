import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { execute } from "@/lib/db";
import { verifyUploadToken } from "@/lib/security";

export const runtime = "nodejs";

/**
 * دریافت فایل با توکن امضاشده.
 * موقتاً در public/uploads ذخیره می‌شود؛ بعداً به دیسک dl.aimelody.ir منتقل/استریم می‌شود.
 */
export async function PUT(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    const payload = verifyUploadToken(token);
    if (!payload) {
      return NextResponse.json({ ok: false, error: "توکن آپلود نامعتبر یا منقضی است" }, { status: 401 });
    }

    const bytes = Buffer.from(await req.arrayBuffer());
    if (!bytes.length) {
      return NextResponse.json({ ok: false, error: "فایل خالی است" }, { status: 400 });
    }

    const dest = path.join(process.cwd(), "public", "uploads", payload.path);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, bytes);

    await execute(
      `UPDATE upload_tickets
       SET used_at = UTC_TIMESTAMP()
       WHERE user_id = :userId AND storage_path = :path AND used_at IS NULL`,
      { userId: payload.userId, path: payload.path },
    );

    return NextResponse.json({
      ok: true,
      storedAs: `/uploads/${payload.path}`,
      targetPublicUrl: `${process.env.DL_BASE_URL || "https://dl.aimelody.ir"}/${payload.path}`,
    });
  } catch (e) {
    console.error("[uploads/put]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور" },
      { status: 500 },
    );
  }
}
