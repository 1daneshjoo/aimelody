import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { downloadFileName, isAllowedDlUrl } from "@/lib/media";

export const runtime = "nodejs";

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_") || "download.bin";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")?.trim();
  const title = req.nextUrl.searchParams.get("title")?.trim() || "aimelody-track";
  const typeParam = req.nextUrl.searchParams.get("type");
  const type = typeParam === "video" ? "video" : "audio";

  if (!url || !isAllowedDlUrl(url)) {
    return NextResponse.json(
      { ok: false, error: "آدرس فایل نامعتبر است" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "*/*" },
      redirect: "follow",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { ok: false, error: "دریافت فایل ناموفق بود" },
        { status: upstream.status === 404 ? 404 : 502 },
      );
    }

    const fileName = downloadFileName(title, url, type);
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstream.headers.get("content-length");

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": contentDisposition(fileName),
      "Cache-Control": "private, max-age=3600",
    });
    if (contentLength) headers.set("Content-Length", contentLength);

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (e) {
    console.error("[download GET]", e);
    return NextResponse.json(
      { ok: false, error: "خطا در دانلود فایل" },
      { status: 500 },
    );
  }
}
