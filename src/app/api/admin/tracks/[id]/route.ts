import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession } from "@/lib/auth";
import { execute, formatDbError } from "@/lib/db";

export const runtime = "nodejs";

type Props = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Props) {
  try {
    const session = await readSession(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ ok: false, error: "دسترسی مدیریت لازم است" }, { status: 403 });
    }

    const { id } = await params;
    const body = (await req.json()) as { status?: string };
    const status = body.status;

    if (status !== "approved" && status !== "rejected" && status !== "pending") {
      return NextResponse.json({ ok: false, error: "وضعیت نامعتبر است" }, { status: 400 });
    }

    const result = await execute(
      `UPDATE tracks SET status = :status WHERE public_id = :id`,
      { status, id },
    );

    if (!result.affectedRows) {
      return NextResponse.json({ ok: false, error: "اثر یافت نشد" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, status });
  } catch (e) {
    console.error("[admin/tracks PATCH]", e);
    const formatted = formatDbError(e);
    return NextResponse.json({ ok: false, error: formatted.error }, { status: 500 });
  }
}
