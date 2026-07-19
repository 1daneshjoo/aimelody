import type { Metadata } from "next";

export const metadata: Metadata = { title: "درباره ما" };

export default function AboutPage() {
  return (
    <div className="container-page max-w-3xl py-12">
      <h1 className="section-title">درباره AiMelody</h1>
      <div className="surface space-y-4 p-6 text-muted leading-8">
        <p>
          AiMelody.ir ویترینی برای آثار موسیقی و موزیک‌ویدئوی ساخته‌شده با هوش مصنوعی است.
          اینجا سازنده‌ها اثرشان را منتشر می‌کنند، مخاطبان با امتیازدهی چندبُعدی قضاوت می‌کنند،
          و مسابقات فصلی بهترین‌ها را بالا می‌آورند.
        </p>
        <p>
          هدف ما ساختن پلی شفاف بین خلاقیت انسانی و ابزارهای جنریتیو است — با تمرکز روی کیفیت شعر،
          ملودی، طبیعی بودن وکال و تجربه بصری.
        </p>
        <p>
          این نسخه فعلی یک پیش‌نمایش فرانت با داده‌های آزمایشی است. بک‌اند، دیتابیس MySQL 8 و
          احراز هویت پیامکی واقعی در فاز بعدی اضافه می‌شوند.
        </p>
      </div>
    </div>
  );
}
