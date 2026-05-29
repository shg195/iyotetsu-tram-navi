import type { Metadata } from "next";
import { IBM_Plex_Sans_JP } from "next/font/google";
import "./globals.css";

// バンドル指定フォント。数字も Plex Sans を使う（chat 最終決定）。
const plexSansJp = IBM_Plex_Sans_JP({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans-jp",
});

export const metadata: Metadata = {
  title: "松山市内電車ナビ",
  description:
    "伊予鉄道 市内電車（路面電車）の出発・到着駅を選ぶだけで、次に乗れる電車の発車時刻・系統・所要時間・運賃がわかる非公式案内アプリ。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${plexSansJp.variable} ${plexSansJp.className} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
