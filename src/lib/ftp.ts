import { execFile } from "child_process";
import { mkdir, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { Readable } from "stream";
import { promisify } from "util";
import CpanelFormData from "form-data";
import { Agent, fetch as undiciFetch } from "undici";
import { Client } from "basic-ftp";

const execFileAsync = promisify(execFile);

function stripQuotes(value: string | undefined) {
  if (!value) return "";
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function basicAuth(user: string, password: string) {
  return `Basic ${Buffer.from(`${user}:${password}`).toString("base64")}`;
}

/** کش ساخت فولدر در طول عمر پروسس — کمتر درخواست به سی‌پنل */
const ensuredDirCache = new Set<string>();

function cpanelTlsInsecure() {
  return process.env.DL_CPANEL_TLS_INSECURE !== "false";
}

const cpanelAgent = new Agent({
  connect: {
    rejectUnauthorized: !cpanelTlsInsecure(),
    timeout: 120_000,
  },
  headersTimeout: 180_000,
  bodyTimeout: 180_000,
});

export function isDlCpanelConfigured() {
  return Boolean(
    process.env.DL_CPANEL_BASE_URL?.trim() &&
      process.env.DL_CPANEL_USER?.trim() &&
      process.env.DL_CPANEL_PASSWORD?.trim() &&
      process.env.DL_CPANEL_DOCROOT?.trim(),
  );
}

export function isDlHttpUploadConfigured() {
  return Boolean(
    process.env.DL_HTTP_UPLOAD_URL?.trim() && process.env.DL_HTTP_UPLOAD_SECRET?.trim(),
  );
}

export function isDlFtpConfigured() {
  return Boolean(
    process.env.DL_FTP_HOST && process.env.DL_FTP_USER && process.env.DL_FTP_PASSWORD,
  );
}

/** لیست آدرس‌های سی‌پنل: اول IP (پایدار)، بعد دامنه */
function cpanelBases(): string[] {
  const configured = (process.env.DL_CPANEL_BASE_URL || "").replace(/\/+$/, "");
  const ip = (process.env.DL_CPANEL_IP || "158.58.190.44").trim();
  const port = (process.env.DL_CPANEL_PORT || "2083").trim();
  const byIp = `https://${ip}:${port}`;
  const list = [configured, byIp].filter(Boolean);
  return [...new Set(list)];
}

function explainNetworkError(e: unknown): string {
  const err = e as { message?: string; cause?: { code?: string; message?: string; hostname?: string } };
  const code = err.cause?.code || "";
  const hostname = err.cause?.hostname || "";
  if (code === "ENOTFOUND") {
    return `DNS دامنه سی‌پنل پیدا نشد (${hostname || "hostname"}). از IP در DL_CPANEL_BASE_URL استفاده کنید.`;
  }
  if (code === "ETIMEDOUT" || code === "ECONNREFUSED") {
    return `اتصال به سی‌پنل برقرار نشد (${code}). VPN یا فایروال را بررسی کنید.`;
  }
  return err.cause?.message || err.message || "خطای شبکه سی‌پنل";
}

async function cpanelFetch(
  pathAndQuery: string,
  init: { method?: string; headers?: Record<string, string>; body?: BodyInit },
) {
  const user = process.env.DL_CPANEL_USER!.trim();
  const password = stripQuotes(process.env.DL_CPANEL_PASSWORD);
  const headers = {
    ...(init.headers || {}),
    Authorization: basicAuth(user, password),
  };

  let lastError: unknown;
  for (const base of cpanelBases()) {
    const url = `${base}${pathAndQuery.startsWith("/") ? "" : "/"}${pathAndQuery}`;
    try {
      const res = await undiciFetch(url, {
        method: init.method || "GET",
        headers,
        body: init.body as import("undici").BodyInit | undefined,
        dispatcher: cpanelAgent,
      });
      const text = await res.text();
      return { res, text, base };
    } catch (e) {
      lastError = e;
      console.warn("[cpanelFetch] failed via", base, explainNetworkError(e));
    }
  }
  throw new Error(explainNetworkError(lastError));
}

async function cpanelMkdir(parentPath: string, name: string) {
  const key = `${parentPath}/${name}`;
  if (ensuredDirCache.has(key)) return;

  const qs = new URLSearchParams({
    cpanel_jsonapi_user: process.env.DL_CPANEL_USER!.trim(),
    cpanel_jsonapi_apiversion: "2",
    cpanel_jsonapi_module: "Fileman",
    cpanel_jsonapi_func: "mkdir",
    path: parentPath,
    name,
    permissions: "0755",
  });

  const { res, text } = await cpanelFetch(`/json-api/cpanel?${qs.toString()}`, {
    method: "GET",
  });

  // فولدر از قبل باشد هم OK
  const exists = /File exists|already exists/i.test(text);
  if (!res.ok && !exists) {
    throw new Error(`cPanel mkdir HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  ensuredDirCache.add(key);
}

async function ensureCpanelDirs(relativeDir: string) {
  const docroot = process.env.DL_CPANEL_DOCROOT!.replace(/\/+$/, "");
  const segments = relativeDir.split("/").filter(Boolean);
  let parent = docroot;
  for (const name of segments) {
    await cpanelMkdir(parent, name);
    parent = `${parent}/${name}`;
  }
  return parent;
}

/** مسیر مطلق → مسیر نسبی نسبت به home کاربر (الزام UAPI) مثل public_html/uploads/... */
function toCpanelHomeRelative(absolutePath: string): string {
  const abs = absolutePath.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
  const homeMatch = abs.match(/^\/home\/[^/]+\/(.+)$/);
  if (homeMatch) return homeMatch[1];

  const docroot = process.env.DL_CPANEL_DOCROOT!.replace(/\/+$/, "").replace(/\\/g, "/");
  const home = docroot.replace(/\/[^/]+$/, "");
  if (abs === docroot || abs.startsWith(`${docroot}/`)) {
    const rest = abs.slice(docroot.length).replace(/^\/+/, "");
    const leaf = docroot.split("/").pop() || "public_html";
    return rest ? `${leaf}/${rest}` : leaf;
  }
  if (abs.startsWith(`${home}/`)) return abs.slice(home.length + 1);
  return abs.replace(/^\/+/, "");
}

function parseCpanelUploadResponse(text: string, httpStatus: number) {
  let raw: { status?: number; errors?: string[] | null; data?: { succeeded?: number } } = {};
  try {
    raw = JSON.parse(text) as typeof raw;
  } catch {
    throw new Error(`cPanel upload پاسخ نامعتبر: ${text.slice(0, 200)}`);
  }
  if (httpStatus < 200 || httpStatus >= 300 || raw.status !== 1 || !raw.data?.succeeded) {
    const err = raw.errors?.join("; ") || `HTTP ${httpStatus}`;
    throw new Error(`آپلود سی‌پنل ناموفق: ${err}`);
  }
}

/** آپلود با بافر multipart — undici استریم form-data را درست نمی‌فرستد */
async function uploadViaCpanelBuffer(
  base: string,
  relativeDir: string,
  remoteFile: string,
  bytes: Buffer,
  contentType: string,
  user: string,
  password: string,
) {
  const form = new CpanelFormData();
  form.append("dir", relativeDir);
  form.append("file-1", bytes, {
    filename: remoteFile,
    contentType,
    knownLength: bytes.length,
  });

  const body = form.getBuffer();
  const headers = form.getHeaders();
  const res = await undiciFetch(`${base}/execute/Fileman/upload_files`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Length": String(body.length),
      Authorization: basicAuth(user, password),
    },
    body,
    dispatcher: cpanelAgent,
  });
  const text = await res.text();
  parseCpanelUploadResponse(text, res.status);
}

/** فال‌بک مطمئن با curl (همان روش رسمی مستندات سی‌پنل) */
async function uploadViaCpanelCurl(
  base: string,
  relativeDir: string,
  remoteFile: string,
  bytes: Buffer,
  contentType: string,
  user: string,
  password: string,
) {
  const tmp = path.join(
    tmpdir(),
    `aimelody-up-${Date.now()}-${remoteFile.replace(/[^\w.-]+/g, "_")}`,
  );
  await writeFile(tmp, bytes);
  try {
    const args = [
      "-sk",
      "-u",
      `${user}:${password}`,
      "-F",
      `dir=${relativeDir}`,
      "-F",
      `file-1=@${tmp};filename=${remoteFile};type=${contentType}`,
      `${base}/execute/Fileman/upload_files`,
    ];
    const { stdout } = await execFileAsync("curl", args, {
      maxBuffer: 8 * 1024 * 1024,
      windowsHide: true,
    });
    parseCpanelUploadResponse(String(stdout), 200);
  } finally {
    await unlink(tmp).catch(() => {});
  }
}

/** آپلود مستقیم فایل روی هاست از طریق API سی‌پنل (HTTPS :2083) */
export async function uploadViaCpanel(storagePath: string, bytes: Buffer, contentType?: string) {
  if (!isDlCpanelConfigured()) {
    throw new Error("سی‌پنل پیکربندی نشده است");
  }

  const docroot = process.env.DL_CPANEL_DOCROOT!.replace(/\/+$/, "");
  const normalized = storagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const remoteDir = path.posix.dirname(normalized);
  const remoteFile = path.posix.basename(normalized);
  const mime = contentType || "application/octet-stream";

  if (remoteDir && remoteDir !== ".") {
    await ensureCpanelDirs(remoteDir);
  }

  const absoluteDir =
    remoteDir && remoteDir !== "." ? `${docroot}/${remoteDir}` : docroot;
  const relativeDir = toCpanelHomeRelative(absoluteDir);

  const user = process.env.DL_CPANEL_USER!.trim();
  const password = stripQuotes(process.env.DL_CPANEL_PASSWORD);

  let lastError: unknown;
  for (const base of cpanelBases()) {
    try {
      await uploadViaCpanelBuffer(base, relativeDir, remoteFile, bytes, mime, user, password);
      return normalized;
    } catch (e) {
      lastError = e;
      console.warn("[uploadViaCpanel] buffer failed via", base, e instanceof Error ? e.message : e);
      try {
        await uploadViaCpanelCurl(base, relativeDir, remoteFile, bytes, mime, user, password);
        return normalized;
      } catch (e2) {
        lastError = e2;
        console.warn("[uploadViaCpanel] curl failed via", base, e2 instanceof Error ? e2.message : e2);
      }
    }
  }

  throw new Error(
    lastError instanceof Error ? lastError.message : explainNetworkError(lastError),
  );
}

export async function uploadViaHttp(storagePath: string, bytes: Buffer, contentType?: string) {
  const url = process.env.DL_HTTP_UPLOAD_URL?.trim();
  const secret = stripQuotes(process.env.DL_HTTP_UPLOAD_SECRET);
  if (!url || !secret) {
    throw new Error("آپلود HTTP پیکربندی نشده است");
  }

  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const form = new FormData();
  form.set("secret", secret);
  form.set("path", storagePath.replace(/\\/g, "/"));
  form.set(
    "file",
    new Blob([copy], { type: contentType || "application/octet-stream" }),
    path.posix.basename(storagePath),
  );

  const res = await fetch(url, { method: "POST", body: form, cache: "no-store" });
  const text = await res.text();
  let raw: unknown = text;
  try {
    raw = JSON.parse(text);
  } catch {
    // ignore
  }
  if (!res.ok) {
    const err =
      typeof raw === "object" && raw && "error" in raw
        ? String((raw as { error: string }).error)
        : `HTTP ${res.status}`;
    throw new Error(`آپلود HTTPS ناموفق: ${err}`);
  }
  return storagePath;
}

export async function uploadViaFtp(storagePath: string, bytes: Buffer) {
  if (!isDlFtpConfigured()) {
    throw new Error("FTP سرور دانلود پیکربندی نشده است");
  }

  const client = new Client(20_000);
  client.ftp.verbose = process.env.DL_FTP_VERBOSE === "true";

  try {
    await client.access({
      host: process.env.DL_FTP_HOST,
      port: Number(process.env.DL_FTP_PORT || 21),
      user: process.env.DL_FTP_USER,
      password: stripQuotes(process.env.DL_FTP_PASSWORD),
      secure: process.env.DL_FTP_SECURE === "true",
    });

    const remoteDir = path.posix.dirname(storagePath).replace(/\\/g, "/");
    const remoteFile = path.posix.basename(storagePath);
    const baseDir = (process.env.DL_FTP_BASE_DIR || "").replace(/\/+$/, "");
    const fullDir = baseDir ? `${baseDir}/${remoteDir}` : remoteDir;

    await client.ensureDir(fullDir);
    await client.uploadFrom(Readable.from(bytes), remoteFile);
    return `${fullDir}/${remoteFile}`;
  } finally {
    client.close();
  }
}

export async function saveLocalUpload(storagePath: string, bytes: Buffer) {
  const dest = path.join(process.cwd(), "public", "uploads", storagePath);
  await mkdir(path.dirname(dest), { recursive: true });
  await writeFile(dest, bytes);
  return `/uploads/${storagePath.replace(/\\/g, "/")}`;
}

export type StoredUpload = {
  via: "cpanel" | "http" | "ftp" | "local";
  publicPathHint?: string;
};

/**
 * اولویت: سی‌پنل (HTTPS) → PHP HTTPS → FTP → لوکال
 */
export async function storeUpload(
  storagePath: string,
  bytes: Buffer,
  contentType?: string,
): Promise<StoredUpload> {
  if (isDlCpanelConfigured()) {
    await uploadViaCpanel(storagePath, bytes, contentType);
    return { via: "cpanel" };
  }

  if (isDlHttpUploadConfigured()) {
    await uploadViaHttp(storagePath, bytes, contentType);
    return { via: "http" };
  }

  if (isDlFtpConfigured()) {
    try {
      await uploadViaFtp(storagePath, bytes);
      return { via: "ftp" };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const allowLocal =
        process.env.DL_UPLOAD_LOCAL_FALLBACK !== "false" &&
        /ETIMEDOUT|ECONNREFUSED|ENOTFOUND|timeout/i.test(msg);
      if (!allowLocal) throw e;
      console.warn("[storeUpload] FTP failed, falling back to local:", msg);
      const publicPathHint = await saveLocalUpload(storagePath, bytes);
      return { via: "local", publicPathHint };
    }
  }

  const publicPathHint = await saveLocalUpload(storagePath, bytes);
  return { via: "local", publicPathHint };
}
