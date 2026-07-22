/**
 * بیلد لوکال + بسته deploy آماده cPanel
 * خروجی: cpanel-deploy.zip
 *
 * روی سرور فقط: Extract + RESTART (بدون npm install / npm run build)
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STAGING = path.join(ROOT, ".deploy-staging");
const STANDALONE = path.join(ROOT, ".next", "standalone");
const OUT_ZIP = path.join(ROOT, "cpanel-deploy.zip");
const PUBLIC_NEXT = path.join(ROOT, "public", "_next");

function run(cmd) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function countFiles(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    n += entry.isDirectory() ? countFiles(p) : 1;
  }
  return n;
}

/** tar شامل پوشه‌های مخفی مثل .next هم می‌شود (برخلاف Compress-Archive ویندوز) */
function createZip(sourceDir, outZip) {
  if (fs.existsSync(outZip)) fs.rmSync(outZip);
  run(`tar -caf "${outZip}" -C "${sourceDir}" .`);
}

function verifyStaging() {
  const required = [
    path.join(STAGING, "server.js"),
    path.join(STAGING, "package.json"),
    path.join(STAGING, ".next", "static", "chunks"),
    path.join(STAGING, ".next", "BUILD_ID"),
    path.join(STAGING, "public", "_next", "static", "chunks"),
  ];
  for (const p of required) {
    if (!fs.existsSync(p)) {
      console.error(`خطا: فایل لازم در بسته نیست: ${p}`);
      process.exit(1);
    }
  }
  const chunkCount = countFiles(path.join(STAGING, ".next", "static", "chunks"));
  if (chunkCount < 5) {
    console.error(`خطا: تعداد فایل‌های static کم است (${chunkCount})`);
    process.exit(1);
  }
  console.log(`> تأیید بسته: ${chunkCount} فایل static`);
}

console.log("=== AiMelody cPanel deploy pack ===\n");

// Next.js اجازه نمی‌دهد public/_next هنگام بیلد وجود داشته باشد
if (fs.existsSync(PUBLIC_NEXT)) {
  console.log("> حذف public/_next باقی‌مانده از دیپلوی قبلی...");
  rmDir(PUBLIC_NEXT);
}

run("npm run build");

if (!fs.existsSync(STANDALONE)) {
  console.error("خطا: .next/standalone ساخته نشد. output: standalone در next.config فعال است؟");
  process.exit(1);
}

const staticSrc = path.join(ROOT, ".next", "static");
if (!fs.existsSync(staticSrc)) {
  console.error("خطا: .next/static یافت نشد");
  process.exit(1);
}

rmDir(STAGING);
fs.mkdirSync(STAGING, { recursive: true });

console.log("\n> کپی standalone...");
copyDir(STANDALONE, STAGING);

console.log("> کپی .next/static و public...");
copyDir(staticSrc, path.join(STAGING, ".next", "static"));
copyDir(path.join(ROOT, "public"), path.join(STAGING, "public"));

// فقط داخل بستهٔ دیپلوی — نه در public پروژه (Next بیلد بعدی را خراب می‌کند)
console.log("> کپی static به staging/public/_next/static...");
copyDir(staticSrc, path.join(STAGING, "public", "_next", "static"));

console.log("> جایگزینی server.js برای Passenger...");
fs.copyFileSync(
  path.join(ROOT, "deploy", "cpanel-server.js"),
  path.join(STAGING, "server.js"),
);

const pkg = {
  name: "aimelody.ir",
  version: JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).version,
  private: true,
  scripts: { start: "node server.js" },
};
fs.writeFileSync(path.join(STAGING, "package.json"), JSON.stringify(pkg, null, 2));

verifyStaging();

console.log("> ساخت zip (tar)...");
createZip(STAGING, OUT_ZIP);

const sizeMb = (fs.statSync(OUT_ZIP).size / (1024 * 1024)).toFixed(1);
console.log(`\n✓ آماده: ${OUT_ZIP} (${sizeMb} MB)`);
console.log(`
روی سرور:
  1) محتویات قدیمی apps-aimelody را پاک کنید (به‌خصوص .next و public/_next)
  2) cpanel-deploy.zip را Extract کنید
  3) RESTART در پنل Node

بررسی روی سرور:
  ls .next/static/chunks | wc -l
  ls public/_next/static/chunks | wc -l
`);
