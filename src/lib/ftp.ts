import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { Client } from "basic-ftp";

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

async function cpanelMkdir(parentPath: string, name: string) {
  const base = process.env.DL_CPANEL_BASE_URL!.replace(/\/+$/, "");
  const user = process.env.DL_CPANEL_USER!.trim();
  const password = stripQuotes(process.env.DL_CPANEL_PASSWORD);
  const url = new URL(`${base}/json-api/cpanel`);
  url.searchParams.set("cpanel_jsonapi_user", user);
  url.searchParams.set("cpanel_jsonapi_apiversion", "2");
  url.searchParams.set("cpanel_jsonapi_module", "Fileman");
  url.searchParams.set("cpanel_jsonapi_func", "mkdir");
  url.searchParams.set("path", parentPath);
  url.searchParams.set("name", name);
  url.searchParams.set("permissions", "0755");

  const res = await fetch(url, {
    headers: { Authorization: basicAuth(user, password) },
    cache: "no-store",
  });
  const text = await res.text();
  // اگر فولدر از قبل باشد، سی‌پنل معمولاً باز هم 200 می‌دهد یا خطای قابل چشم‌پوشی
  if (!res.ok) {
    throw new Error(`cPanel mkdir HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
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

/** آپلود مستقیم فایل روی هاست از طریق API سی‌پنل (HTTPS :2083) */
export async function uploadViaCpanel(storagePath: string, bytes: Buffer, contentType?: string) {
  if (!isDlCpanelConfigured()) {
    throw new Error("سی‌پنل پیکربندی نشده است");
  }

  const base = process.env.DL_CPANEL_BASE_URL!.replace(/\/+$/, "");
  const user = process.env.DL_CPANEL_USER!.trim();
  const password = stripQuotes(process.env.DL_CPANEL_PASSWORD);
  const docroot = process.env.DL_CPANEL_DOCROOT!.replace(/\/+$/, "");

  const normalized = storagePath.replace(/\\/g, "/").replace(/^\/+/, "");
  const remoteDir = path.posix.dirname(normalized);
  const remoteFile = path.posix.basename(normalized);

  if (remoteDir && remoteDir !== ".") {
    await ensureCpanelDirs(remoteDir);
  }

  const form = new FormData();
  form.set("dir", remoteDir && remoteDir !== "." ? `${docroot}/${remoteDir}` : docroot);
  form.set(
    "file-1",
    new Blob([Uint8Array.from(bytes)], {
      type: contentType || "application/octet-stream",
    }),
    remoteFile,
  );

  const res = await fetch(`${base}/execute/Fileman/upload_files`, {
    method: "POST",
    headers: { Authorization: basicAuth(user, password) },
    body: form,
    cache: "no-store",
  });

  const text = await res.text();
  let raw: { status?: number; errors?: string[] | null; data?: { succeeded?: number } } = {};
  try {
    raw = JSON.parse(text) as typeof raw;
  } catch {
    throw new Error(`cPanel upload پاسخ نامعتبر: ${text.slice(0, 200)}`);
  }

  if (!res.ok || raw.status !== 1 || !raw.data?.succeeded) {
    const err = raw.errors?.join("; ") || `HTTP ${res.status}`;
    throw new Error(`آپلود سی‌پنل ناموفق: ${err}`);
  }

  return normalized;
}

export async function uploadViaHttp(storagePath: string, bytes: Buffer, contentType?: string) {
  const url = process.env.DL_HTTP_UPLOAD_URL?.trim();
  const secret = stripQuotes(process.env.DL_HTTP_UPLOAD_SECRET);
  if (!url || !secret) {
    throw new Error("آپلود HTTP پیکربندی نشده است");
  }

  const form = new FormData();
  form.set("secret", secret);
  form.set("path", storagePath.replace(/\\/g, "/"));
  form.set(
    "file",
    new Blob([Uint8Array.from(bytes)], { type: contentType || "application/octet-stream" }),
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
