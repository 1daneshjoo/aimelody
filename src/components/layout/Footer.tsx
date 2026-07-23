import Link from "next/link";
import Script from "next/script";
import { AuthLink } from "@/components/auth/AuthLink";

const matomoScript = `
var _paq = window._paq = window._paq || [];
_paq.push(['trackPageView']);
_paq.push(['enableLinkTracking']);
(function() {
  var u="https://piwik.partocms.com/";
  _paq.push(['setTrackerUrl', u+'matomo.php']);
  _paq.push(['setSiteId', '32']);
  var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
  g.async=true; g.src=u+'matomo.js'; s.parentNode.insertBefore(g,s);
})();
`;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line bg-bg-soft/60">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-8 py-12 md:grid-cols-[1.4fr_1fr_1fr] md:gap-8">
        <div className="col-span-2 md:col-span-1">
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
              <Link href="/explore">آرشیو</Link>
            </li>
            <li>
              <Link href="/competitions">مسابقات</Link>
            </li>
            <li>
              <AuthLink href="/upload">ارسال اثر</AuthLink>
            </li>
            <li>
              <AuthLink href="/dashboard">داشبورد</AuthLink>
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
              <Link href="/login">ثبت نام/ورود</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © ۱۴۰۵ AiMelody.ir
      </div>
      <Script id="matomo-analytics" strategy="afterInteractive">
        {matomoScript}
      </Script>
    </footer>
  );
}
