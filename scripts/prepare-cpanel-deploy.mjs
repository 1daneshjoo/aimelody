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

function createZip(sourceDir, outZip) {
  rmDir(outZip);
  if (process.platform === "win32") {
    const src = path.join(sourceDir, "*");
    run(
      `powershell -NoProfile -Command "Compress-Archive -Path '${src}' -DestinationPath '${outZip}' -Force"`,
    );
  } else {
    run(`cd "${sourceDir}" && zip -rq "${outZip}" .`);
  }
}

console.log("=== AiMelody cPanel deploy pack ===\n");

run("npm run build");

if (!fs.existsSync(STANDALONE)) {
  console.error("خطا: .next/standalone ساخته نشد. output: standalone در next.config فعال است؟");
  process.exit(1);
}

rmDir(STAGING);
fs.mkdirSync(STAGING, { recursive: true });

console.log("\n> کپی standalone...");
copyDir(STANDALONE, STAGING);

console.log("> کپی static و public...");
copyDir(path.join(ROOT, ".next", "static"), path.join(STAGING, ".next", "static"));
copyDir(path.join(ROOT, "public"), path.join(STAGING, "public"));

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

console.log("> ساخت zip...");
createZip(STAGING, OUT_ZIP);

const sizeMb = (fs.statSync(OUT_ZIP).size / (1024 * 1024)).toFixed(1);
console.log(`\n✓ آماده: ${OUT_ZIP} (${sizeMb} MB)`);
console.log(`
روی سرور:
  1) cpanel-deploy.zip را در apps-aimelody آپلود و Extract کنید (جایگزین فایل‌ها)
  2) env در پنل Node را نگه دارید — داخل zip نیست
  3) RESTART اپ

نیازی به git pull / npm install / npm run build روی سرور نیست.
`);
