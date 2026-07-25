/**
 * حذف public/_next قبل از بیلد Next.
 * این پوشه فقط بعد از sync:static برای سی‌پنل ساخته می‌شود
 * و وجودش هنگام build خطا می‌دهد.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = path.join(ROOT, "public", "_next");

if (fs.existsSync(target)) {
  fs.rmSync(target, { recursive: true, force: true });
  console.log("[prebuild] حذف شد: public/_next");
} else {
  console.log("[prebuild] public/_next نبود — ادامه بیلد");
}
