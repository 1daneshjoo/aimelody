import type { Metadata } from "next";

export const metadata: Metadata = { title: "قوانین و مقررات" };

const rules = [
  "ثبت‌نام و رأی‌دهی فقط با شماره موبایل معتبر ایرانی انجام می‌شود.",
  "آثار ارسالی پس از بررسی مدیر منتشر می‌شوند؛ محتوای توهین‌آمیز یا ناقض حقوق دیگران رد می‌گردد.",
  "کاربر مسئول رعایت حقوق مالکیت فکری متن، صدا، تصویر و وکال است.",
  "هنگام آپلود باید شاعر، مالک صدای خواننده و منبع وکال مشخص شود.",
  "رأی‌دهی چندحسابی یا تقلب منجر به محدودیت حساب می‌شود.",
  "تبلیغات و آثار پروموت‌شده به‌صورت شفاف برچسب می‌خورند.",
];

export default function TermsPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="section-title">قوانین و مقررات</h1>
      <p className="section-sub">نسخه پیش‌نویس برای نمایش دمو</p>
      <ol className="surface space-y-4 p-6">
        {rules.map((rule, i) => (
          <li key={rule} className="flex gap-3 text-muted">
            <span className="font-display text-accent">{i + 1}</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
