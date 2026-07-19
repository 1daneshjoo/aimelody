import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth";
import { execute } from "@/lib/db";
import { buildDlPath, buildDlUrl, type MediaKind } from "@/lib/media";
import { signUploadToken } from "@/lib/security";

export const runtime = "nodejs";

function kindFrom(mediaType: string): MediaKind | null {
  if (mediaType === "audio") return "audio";
  if (mediaType === "video") return "video";
  if (mediaType === "cover") return "covers";
  if (mediaType === "avatar") return "avatars";
  return null;
}

/**
 * درخواست URL امضاشده برای آپلود به dl
 * فرانت فقط uploadUrl موقت می‌گیرد؛ FTP فقط سمت سرور با رمز از env انجام می‌شود.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "ابتدا وارد شوید" }, { status: 401 });
    }

    const body = (await req.json()) as {
      fileName?: string;
      contentType?: string;
      mediaType?: string;
      sizeBytes?: number;
    };

    const kind = kindFrom(body.mediaType || "");
    if (!kind || !body.fileName || !body.contentType) {
      return NextResponse.json({ ok: false, error: "پارامترهای آپلود ناقص است" }, { status: 400 });
    }

    if (typeof body.sizeBytes === "number" && body.sizeBytes > 200 * 1024 * 1024) {
      return NextResponse.json({ ok: false, error: "حجم فایل بیش از حد مجاز است" }, { status: 400 });
    }

    const ext = body.fileName.includes(".")
      ? body.fileName.slice(body.fileName.lastIndexOf("."))
      : "";
    const safeName = `${randomUUID()}${ext}`;
    const storagePath = buildDlPath(kind, safeName);
    const publicUrl = buildDlUrl(kind, safeName);
    const ttl = Number(process.env.DL_UPLOAD_TTL_SEC || 900);
    const exp = Math.floor(Date.now() / 1000) + ttl;
    const token = signUploadToken({ path: storagePath, userId: session.id, exp });

    // upload URL موقت روی خود اپ (تا پروکسی/سرور dl وصل شود)
    const uploadUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/uploads/put?token=${encodeURIComponent(token)}`;

    await execute(
      `INSERT INTO upload_tickets
        (user_id, media_kind, storage_path, public_url, content_type, expires_at)
       VALUES
        (:userId, :kind, :storagePath, :publicUrl, :contentType, :expiresAt)`,
      {
        userId: session.id,
        kind,
        storagePath,
        publicUrl,
        contentType: body.contentType,
        expiresAt: new Date(exp * 1000),
      },
    );

    return NextResponse.json({
      ok: true,
      uploadUrl,
      publicUrl,
      storagePath,
      method: "PUT",
      headers: {
        "Content-Type": body.contentType,
      },
      expiresInSec: ttl,
    });
  } catch (e) {
    console.error("[uploads/sign]", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "خطای سرور" },
      { status: 500 },
    );
  }
}
