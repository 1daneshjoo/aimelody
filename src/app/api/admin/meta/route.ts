import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth";
import { formatDbError } from "@/lib/db";
import {
  getAdminUsersFromDb,
  getAdsFromDb,
  getCompetitionsFromDb,
} from "@/lib/tracks-server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const session = await readSession(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "دسترسی مدیریت لازم است" }, { status: 403 });
    }

    const [users, ads, competitions] = await Promise.all([
      getAdminUsersFromDb(),
      getAdsFromDb(),
      getCompetitionsFromDb(),
    ]);

    return NextResponse.json({ ok: true, users, ads, competitions });
  } catch (e) {
    console.error("[admin/meta GET]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
