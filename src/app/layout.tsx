import type { Metadata } from "next";
import Script from "next/script";
import { Vazirmatn } from "next/font/google";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { AuthGate } from "@/components/auth/AuthGate";
import { ProfileGate } from "@/components/auth/ProfileGate";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { LibraryProvider } from "@/components/library/LibraryProvider";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { PlayerProvider } from "@/components/player/PlayerProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
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

const themeInitScript = `
(function(){
  try {
    var t = localStorage.getItem('aimelody-theme');
    document.documentElement.dataset.theme = (t === 'dark' || t === 'light') ? t : 'light';
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full`} data-theme="light" suppressHydrationWarning>
      <body
        className={`${vazirmatn.className} flex min-h-full flex-col antialiased`}
        suppressHydrationWarning
      >
        <Script id="aimelody-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
          <AuthProvider>
            <AuthGate>
              <ProfileGate>
                <LibraryProvider>
                  <PlayerProvider>
                    <Header />
                    <main className="flex-1 pb-36 md:pb-28">{children}</main>
                    <Footer />
                    <MiniPlayer />
                    <MobileNav />
                  </PlayerProvider>
                </LibraryProvider>
              </ProfileGate>
            </AuthGate>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
