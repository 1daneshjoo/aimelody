/**
 * آپلود امن به سرور جدا (dl.aimelody.ir)
 *
 * قانون طلایی: هیچ کلید FTP/S3/SSH و توکن دائمی در فرانت نباشد.
 *
 * مدل: Presigned / Signed URL از API بک‌اند
 * 1) POST /api/uploads/sign
 * 2) PUT مستقیم به uploadUrl برگشتی
 */

import { buildDlPath, buildDlUrl, kindFromTrackType, type MediaKind } from "@/lib/media";

export type SignedUploadRequest = {
  fileName: string;
  contentType: string;
  mediaType: "audio" | "video" | "cover";
  sizeBytes: number;
};

export type SignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  storagePath: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  expiresInSec: number;
};

function kindFromRequest(mediaType: SignedUploadRequest["mediaType"]): MediaKind {
  if (mediaType === "cover") return "covers";
  return kindFromTrackType(mediaType);
}

export async function requestSignedUpload(
  req: SignedUploadRequest,
): Promise<SignedUploadResponse> {
  const res = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  const data = (await res.json()) as SignedUploadResponse & {
    ok?: boolean;
    error?: string;
  };
  if (!res.ok || data.ok === false) {
    // fallback لوکال برای UI دمو اگر لاگین نباشد
    if (res.status === 401) {
      const kind = kindFromRequest(req.mediaType);
      const publicUrl = buildDlUrl(kind, req.fileName);
      return {
        uploadUrl: publicUrl,
        publicUrl,
        storagePath: buildDlPath(kind, req.fileName),
        method: "PUT",
        headers: { "Content-Type": req.contentType },
        expiresInSec: 900,
      };
    }
    throw new Error(data.error || "دریافت URL آپلود ناموفق بود");
  }
  return data;
}

export function uploadToSignedUrl(
  file: File,
  signed: SignedUploadResponse,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(signed.method, signed.uploadUrl);
    Object.entries(signed.headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(`آپلود ناموفق (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("خطای شبکه هنگام آپلود"));
    xhr.send(file);
  });
}
