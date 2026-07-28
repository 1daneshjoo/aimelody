/**
 * IPPanel Edge
 * - OTP با پترن: /v1/api/send/pattern/normal
 * - فال‌بک: SMS متن آزاد قدیمی
 */

export type SendSmsResult =
  | { ok: true; raw: unknown }
  | { ok: false; error: string; raw?: unknown };

function authHeaders(apiKey: string) {
  return {
    Accept: "application/json",
    Authorization: apiKey,
  };
}

function apiKeyHeaders(apiKey: string) {
  return {
    Accept: "application/json",
    apikey: apiKey,
  };
}

function patternConfig() {
  return {
    code: process.env.IPPANEL_OTP_PATTERN_CODE?.trim(),
    sender: process.env.IPPANEL_OTP_PATTERN_SENDER?.trim() || process.env.IPPANEL_FROM?.trim(),
    codeKey: process.env.IPPANEL_OTP_PATTERN_VAR_CODE?.trim() || "code",
    minutesKey: process.env.IPPANEL_OTP_PATTERN_VAR_MINUTES?.trim() || "",
    appKey: process.env.IPPANEL_OTP_PATTERN_VAR_APP?.trim() || "",
    appValue: process.env.IPPANEL_OTP_PATTERN_APP_NAME?.trim() || "AiMelody",
  };
}

async function sendPatternOtp(
  toE164: string,
  params: Record<string, string>,
): Promise<SendSmsResult> {
  const apiKey = process.env.IPPANEL_ACCESS_KEY?.trim();
  const cfg = patternConfig();

  if (!apiKey) {
    return { ok: false, error: "IPPANEL_ACCESS_KEY تنظیم نشده است" };
  }
  if (!cfg.code) {
    return { ok: false, error: "IPPANEL_OTP_PATTERN_CODE تنظیم نشده است" };
  }
  if (!cfg.sender) {
    return { ok: false, error: "IPPANEL_OTP_PATTERN_SENDER / IPPANEL_FROM تنظیم نشده است" };
  }

  const attempts = [
    {
      url: "https://edge.ippanel.com/v1/api/patterns/send",
      headers: {
        ...authHeaders(apiKey),
        "Content-Type": "application/json",
      },
      body: {
        pattern_code: cfg.code,
        sender: cfg.sender,
        recipient: toE164,
        params,
      },
    },
    {
      url: "https://edge.ippanel.com/v1/api/patterns/send",
      headers: {
        ...authHeaders(apiKey),
        "Content-Type": "application/json",
      },
      body: {
        pattern_code: cfg.code,
        sender: cfg.sender,
        recipient: toE164,
        values: params,
      },
    },
    {
      url: "https://api2.ippanel.com/api/v1/sms/pattern/normal/send",
      headers: {
        ...apiKeyHeaders(apiKey),
        "Content-Type": "application/json",
      },
      body: {
        code: cfg.code,
        sender: cfg.sender,
        recipient: toE164,
        variable: params,
      },
    },
  ];

  try {
    let lastError: SendSmsResult | null = null;

    for (const attempt of attempts) {
      const res = await fetch(attempt.url, {
        method: "POST",
        headers: attempt.headers,
        body: JSON.stringify(attempt.body),
        cache: "no-store",
      });
      const text = await res.text();
      let raw: unknown = text;
      try {
        raw = JSON.parse(text);
      } catch {
        // plain text response
      }

      if (res.ok) {
        return { ok: true, raw };
      }

      lastError = {
        ok: false,
        error: `IPPanel Pattern HTTP ${res.status}`,
        raw: {
          endpoint: attempt.url,
          body: attempt.body,
          response: raw,
        },
      };

      // اگر endpoint وجود دارد ولی payload/اعتبارسنجی ایراد دارد، دیگر fallback نکن
      if (res.status !== 404) {
        return lastError;
      }
    }

    return lastError || { ok: false, error: "IPPanel Pattern failed" };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "خطای شبکه IPPanel" };
  }
}

async function sendTextSms(toE164: string, message: string): Promise<SendSmsResult> {
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
      headers: authHeaders(apiKey),
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

export async function sendOtpSms(
  toE164: string,
  code: string,
  expiresMinutes: number,
): Promise<SendSmsResult> {
  const cfg = patternConfig();
  if (cfg.code) {
    const variable: Record<string, string> = {
      [cfg.codeKey]: code,
    };
    if (cfg.minutesKey) {
      variable[cfg.minutesKey] = String(expiresMinutes);
    }
    if (cfg.appKey) {
      variable[cfg.appKey] = cfg.appValue;
    }
    return sendPatternOtp(toE164, variable);
  }

  const message = `کد ورود AiMelody: ${code}\nاین کد تا ${expiresMinutes} دقیقه معتبر است.`;
  return sendTextSms(toE164, message);
}
