/**
 * IPPanel Edge — ارسال SMS متن آزاد (بدون پترن)
 * Docs: https://edge.ippanel.com/v1/api/send/webservice?from=&message=&to=&apikey=
 */

export type SendSmsResult =
  | { ok: true; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

export async function sendOtpSms(toE164: string, message: string): Promise<SendSmsResult> {
  const apiKey = process.env.IPPANEL_ACCESS_KEY?.trim();
  const from = process.env.IPPANEL_FROM?.trim();

  if (!apiKey) {
    return { ok: false, error: "IPPANEL_ACCESS_KEY تنظیم نشده است" };
  }
  if (!from) {
    return { ok: false, error: "IPPANEL_FROM (شماره خط) تنظیم نشده است" };
  }

  const url = new URL("https://edge.ippanel.com/v1/api/send/webservice");
  url.searchParams.set("from", from);
  url.searchParams.set("to", toE164);
  url.searchParams.set("message", message);
  url.searchParams.set("apikey", apiKey);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: apiKey,
      },
      cache: "no-store",
    });
    const text = await res.text();
    let raw: unknown = text;
    try {
      raw = JSON.parse(text);
    } catch {
      // plain text response
    }
    if (!res.ok) {
      return { ok: false, error: `IPPanel HTTP ${res.status}`, raw };
    }
    return { ok: true, raw };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطای شبکه IPPanel" };
  }
}
