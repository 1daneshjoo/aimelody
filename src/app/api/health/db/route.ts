import { NextResponse } from "next/server";
import { dbPing, formatDbError } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    await dbPing();
    return NextResponse.json({
      ok: true,
      host: process.env.MYSQL_HOST || "127.0.0.1",
      port: Number(process.env.MYSQL_PORT || 3306),
      user: process.env.MYSQL_USER || "root",
      database: process.env.MYSQL_DATABASE || "melody",
    });
  } catch (e) {
    const formatted = formatDbError(e);
    return NextResponse.json(
      {
        ok: false,
        error: formatted.error,
        detail: formatted.detail,
        host: process.env.MYSQL_HOST || "127.0.0.1",
        port: Number(process.env.MYSQL_PORT || 3306),
        user: process.env.MYSQL_USER || "root",
        database: process.env.MYSQL_DATABASE || "melody",
      },
      { status: 500 },
    );
  }
}
