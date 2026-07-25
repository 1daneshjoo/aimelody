import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getTrackById } from "@/data/mock";
import { getServerSession } from "@/lib/auth";
import { downloadFileName, DL_BASE } from "@/lib/media";
import { getTrackForViewer } from "@/lib/tracks-server";

export const runtime = "nodejs";

function contentDisposition(fileName: string) {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_") || "download.bin";
  const encoded = encodeURIComponent(fileName);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

function appBase() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://aimelody.ir").replace(/\/+$/, "");
}

/** آدرس قابل دریافت برای پروکسی دانلود */
function resolveFetchUrl(mediaUrl: string): string | null {
  const raw = mediaUrl.trim();
  if (!raw) return null;

  if (raw.startsWith("/")) {
    return `${appBase()}${raw}`;
  }

  try {
    const parsed = new URL(raw);
    const dlHost = new URL(DL_BASE).hostname.replace(/^www\./, "");
    const host = parsed.hostname.replace(/^www\./, "");
    const appHost = new URL(appBase()).hostname.replace(/^www\./, "");

    if (
      host === dlHost ||
      host.endsWith(".aimelody.ir") ||
      host === appHost ||
      host === "localhost" ||
      host === "127.0.0.1"
    ) {
      return parsed.toString();
    }
  } catch {
    return null;
  }
  return null;
}

export async function GET(req: NextRequest) {
  const trackId = req.nextUrl.searchParams.get("id")?.trim();
  const legacyUrl = req.nextUrl.searchParams.get("url")?.trim();

  let mediaUrl = "";
  let title = "aimelody-track";
  let type: "audio" | "video" = "audio";

  if (trackId) {
    const session = await getServerSession();
    const viewed = await getTrackForViewer(trackId, session).catch(() => null);
    const track = viewed?.track ?? getTrackById(trackId);

    if (!track) {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }
    if (track.status !== "approved" && !viewed) {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    mediaUrl = track.mediaUrl;
    title = track.title;
    type = track.type;
  } else if (legacyUrl) {
    mediaUrl = legacyUrl;
    title = req.nextUrl.searchParams.get("title")?.trim() || title;
    type = req.nextUrl.searchParams.get("type") === "video" ? "video" : "audio";
  } else {
    return NextResponse.json({ ok: false, error: "شناسه اثر لازم است" }, { status: 400 });
  }

  const fetchUrl = resolveFetchUrl(mediaUrl);
  if (!fetchUrl) {
    return NextResponse.json(
      { ok: false, error: "آدرس فایل نامعتبر است" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(fetchUrl, {
      headers: { Accept: "*/*" },
      redirect: "follow",
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      // اگر پروکسی شکست خورد، کاربر را مستقیم به فایل بفرست
      return NextResponse.redirect(fetchUrl, 302);
    }

    const fileName = downloadFileName(title, mediaUrl, type);
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
    try {
      return NextResponse.redirect(fetchUrl, 302);
    } catch {
      return NextResponse.json(
        { ok: false, error: "خطا در دانلود فایل" },
        { status: 500 },
      );
    }
  }
}
