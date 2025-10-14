import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "헌법 게임",
  description: "O/X 퀴즈로 헌법 암기",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      {/* bg는 globals.css에서 적용되지만, 혹시 몰라 한 번 더 */}
      <body className="min-h-screen bg-teal-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">
          {children}
        </div>
      </body>
    </html>
  );
}
