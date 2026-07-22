/**
 * کپی .next/static → public/_next/static
 * فقط برای دیپلوی git روی سرور، بعد از npm run build.
 * قبل از بیلد بعدی باید public/_next پاک شود (Next اجازهٔ وجودش را نمی‌دهد).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, ".next", "static");
const dest = path.join(ROOT, "public", "_next", "static");

if (!fs.existsSync(src)) {
  console.error("[sync-static] .next/static یافت نشد — اول npm run build بزنید");
  process.exit(1);
}

fs.rmSync(path.join(ROOT, "public", "_next"), { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });

const chunks = path.join(dest, "chunks");
const count = fs.existsSync(chunks) ? fs.readdirSync(chunks).length : 0;
console.log(`[sync-static] ${count} فایل chunk → public/_next/static`);
console.log("[sync-static] هشدار: قبل از بیلد بعدی، public/_next را پاک کنید");
