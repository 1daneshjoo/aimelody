"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [done, setDone] = useState(false);

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="surface w-full max-w-md p-6 md:p-8">
        <p className="font-display text-center text-3xl font-bold">
          Ai<span className="text-accent">Melody</span>
        </p>
        <h1 className="mt-4 text-center text-xl font-bold">ورود / ثبت‌نام پیامکی</h1>
        <p className="mt-2 text-center text-sm text-muted">
          فقط با شماره موبایل — OTP از طریق IPPanel (نسخه دمو)
        </p>

        {!done ? (
          <div className="mt-8 space-y-4">
            <label className="block space-y-2 text-sm">
              <span className="text-muted">شماره موبایل</span>
              <input
                className="field"
                dir="ltr"
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
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
                />
              </label>
            )}

            {!otpSent ? (
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setOtpSent(true)}
                disabled={phone.length < 11}
              >
                ارسال کد تایید
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary w-full"
                onClick={() => setDone(true)}
                disabled={otp.length < 4}
              >
                تایید و ورود
              </button>
            )}
          </div>
        ) : (
          <div className="mt-8 space-y-4 text-center">
            <p className="rounded-xl bg-success/15 p-4 text-success">
              ورود موفقیت‌آمیز (شبیه‌سازی دمو)
            </p>
            <Link href="/dashboard" className="btn btn-primary w-full">
              رفتن به داشبورد
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
