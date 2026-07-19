import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-6xl font-bold text-accent">۴۰۴</p>
      <h1 className="mt-4 text-2xl font-bold">صفحه یا اثر پیدا نشد</h1>
      <p className="mt-2 text-muted">ممکن است اثر هنوز تایید نشده باشد یا آدرس اشتباه باشد.</p>
      <Link href="/" className="btn btn-primary mt-6">
        بازگشت به خانه
      </Link>
    </div>
  );
}
