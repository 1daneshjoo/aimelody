import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-bg-soft/60">
      <div className="container-page grid gap-8 py-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="font-display text-2xl font-bold">
            Ai<span className="text-accent">Melody</span>
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted">
            ویترین آثار موسیقی ساخته‌شده با هوش مصنوعی — گوش بده، امتیاز بده، بدرخش.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold">کاوش</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/explore">چارت‌ها</Link>
            </li>
            <li>
              <Link href="/competitions">مسابقات</Link>
            </li>
            <li>
              <Link href="/upload">ارسال اثر</Link>
            </li>
            <li>
              <Link href="/dashboard">داشبورد</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-bold">اطلاعات</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/about">درباره ما</Link>
            </li>
            <li>
              <Link href="/terms">قوانین و مقررات</Link>
            </li>
            <li>
              <Link href="/login">ورود پیامکی</Link>
            </li>
            <li>
              <Link href="/admin">پنل مدیریت</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © ۱۴۰۵ AiMelody.ir — نسخه دمو با داده آزمایشی
      </div>
    </footer>
  );
}
