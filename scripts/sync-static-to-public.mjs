/**
 * کپی .next/static به public/_next/static
 * روی cPanel/Passenger گاهی فایل‌های CSS/JS از مسیر دوم درست سرو می‌شوند.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(ROOT, ".next", "static");
const dest = path.join(ROOT, "public", "_next", "static");

if (!fs.existsSync(src)) {
  console.warn("[sync-static] .next/static یافت نشد — بیلد انجام شده؟");
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });

const chunks = path.join(dest, "chunks");
const count = fs.existsSync(chunks)
  ? fs.readdirSync(chunks).length
  : 0;
console.log(`[sync-static] ${count} فایل chunk → public/_next/static`);
