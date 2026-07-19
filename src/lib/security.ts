import { createHash, createHmac, randomInt, timingSafeEqual } from "crypto";

export function normalizePhone(input: string) {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("98") && digits.length === 12) return `0${digits.slice(2)}`;
  if (digits.startsWith("9") && digits.length === 10) return `0${digits}`;
  if (digits.startsWith("09") && digits.length === 11) return digits;
  return null;
}

export function toE164Iran(phone09: string) {
  return `+98${phone09.slice(1)}`;
}

export function generateOtpCode() {
  return String(randomInt(100000, 999999));
}

export function hashOtp(phone: string, code: string) {
  const secret = process.env.AUTH_SECRET || "dev-secret";
  return createHash("sha256").update(`${phone}:${code}:${secret}`).digest("hex");
}

export function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function signUploadToken(payload: {
  path: string;
  userId: number;
  exp: number;
}) {
  const secret = process.env.DL_SIGNING_SECRET || "dev-dl-secret";
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyUploadToken(token: string) {
  const secret = process.env.DL_SIGNING_SECRET || "dev-dl-secret";
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      path: string;
      userId: number;
      exp: number;
    };
    if (payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
