"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { safeNextPath } from "@/lib/auth-routes";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="container-page py-16 text-center text-muted">در حال بارگذاری...</div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refresh } = useAuth();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const nextPath = safeNextPath(searchParams.get("next"), "/dashboard");

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      router.replace(user.profileComplete ? nextPath : "/profile/setup");
    }
  }, [authLoading, user, router, nextPath]);

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        demo?: boolean;
        hint?: string;
      };
      if (!data.ok) {
        setError(data.error || "ارسال کد ناموفق بود");
        return;
      }
      setOtpSent(true);
      setInfo(
        data.demo
          ? `${data.message || ""} ${data.hint ? `(${data.hint})` : ""}`.trim()
          : data.message || "کد ارسال شد",
      );
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        user?: { profileComplete?: boolean };
      };
      if (!data.ok) {
        setError(data.error || "تایید ناموفق بود");
        return;
      }
      await refresh();
      const dest = data.user?.profileComplete ? nextPath : "/profile/setup";
      router.push(dest);
      router.refresh();
    } catch {
      setError("خطای شبکه");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="surface w-full max-w-md p-6 md:p-8">
        <p className="text-center text-3xl font-bold">
          Ai<span className="text-accent">Melody</span>
        </p>
        <h1 className="mt-4 text-center text-xl font-bold">ورود / ثبت‌نام</h1>

        <div className="mt-8 space-y-4">
          <label className="block space-y-2 text-sm">
            <span className="text-muted">شماره موبایل</span>
            <input
              className="field"
              dir="ltr"
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
            />
          </label>

          {otpSent && (
            <label className="block space-y-2 text-sm">
              <span className="text-muted">کد تایید</span>
              <input
                className="field"
                dir="ltr"
                placeholder="------"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
            </label>
          )}

          {error && <p className="rounded-xl bg-danger/15 p-3 text-sm text-danger">{error}</p>}
          {info && <p className="rounded-xl bg-accent-soft p-3 text-sm text-accent">{info}</p>}

          {!otpSent ? (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={sendOtp}
              disabled={loading || phone.length < 11}
            >
              {loading ? "در حال ارسال..." : "ارسال کد تایید"}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary w-full"
              onClick={verifyOtp}
              disabled={loading || otp.length < 4}
            >
              {loading ? "در حال بررسی..." : "تایید و ورود"}
            </button>
          )}

          {otpSent && (
            <button
              type="button"
              className="btn btn-ghost w-full"
              onClick={sendOtp}
              disabled={loading}
            >
              ارسال مجدد کد
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          با ورود، <Link href="/terms" className="text-accent">قوانین</Link> را می‌پذیرید.
        </p>
      </div>
    </div>
  );
}
