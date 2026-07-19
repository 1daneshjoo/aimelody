import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AiMelody.ir | ویترین موسیقی هوش مصنوعی",
    template: "%s | AiMelody.ir",
  },
  description:
    "پلتفرم انتشار، امتیازدهی و مسابقه آثار صوتی و ویدئویی ساخته‌شده با هوش مصنوعی",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`}>
      <body className={`${vazirmatn.className} flex min-h-full flex-col antialiased`}>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
