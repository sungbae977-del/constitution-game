// app/layout.tsx

import "./globals.css";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "헌법게임",
  description: "헌법 OX 퀴즈",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <nav style={{ display: "flex", gap: "1rem", padding: "1rem" }}>
          <Link href="/">홈</Link>
          <Link href="/review">틀린 문제 목록</Link>
        </nav>
        {children}
      </body>
    </html>
  );
}
