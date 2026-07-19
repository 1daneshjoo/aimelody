/**
 * آپلود امن به سرور جدا (dl.aimelody.ir)
 *
 * قانون طلایی: هیچ کلید FTP و توکن دائمی در فرانت نباشد.
 *
 * مدل:
 * 1) POST /api/uploads/sign  → uploadUrl موقت
 * 2) PUT به همان uploadUrl   → سرور خودش به dl می‌فرستد
 */

export type SignedUploadRequest = {
  fileName: string;
  contentType: string;
  mediaType: "audio" | "video" | "cover" | "avatar";
  sizeBytes: number;
};

export type SignedUploadResponse = {
  uploadUrl: string;
  /** مسیر نهایی عمومی — اگر لوکال ذخیره‌شده، بعد از PUT ممکن است عوض شود */
  publicUrl: string;
  storagePath: string;
  method: "PUT" | "POST";
  headers: Record<string, string>;
  expiresInSec: number;
};

export type UploadedFile = {
  publicUrl: string;
  storagePath: string;
  storedVia?: string;
};

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
    throw new Error(data.error || "دریافت لینک آپلود ناموفق بود");
  }
  return data;
}

export function uploadToSignedUrl(
  file: File,
  signed: SignedUploadResponse,
  onProgress?: (percent: number) => void,
): Promise<UploadedFile> {
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
        let localUrl: string | undefined;
        let storedVia: string | undefined;
        try {
          const parsed = JSON.parse(xhr.responseText) as {
            localUrl?: string;
            storedVia?: string;
          };
          localUrl = parsed.localUrl;
          storedVia = parsed.storedVia;
        } catch {
          // ignore
        }
        resolve({
          publicUrl: localUrl || signed.publicUrl,
          storagePath: signed.storagePath,
          storedVia,
        });
      } else {
        let detail = `آپلود ناموفق (${xhr.status})`;
        try {
          const parsed = JSON.parse(xhr.responseText) as { error?: string; hint?: string };
          if (parsed.error) detail = parsed.error;
          if (parsed.hint) detail = `${detail} — ${parsed.hint}`;
        } catch {
          // ignore
        }
        reject(new Error(detail));
      }
    };
    xhr.onerror = () => reject(new Error("خطای شبکه هنگام آپلود"));
    xhr.send(file);
  });
}
