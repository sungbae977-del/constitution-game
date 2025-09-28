import './globals.css'; // ✅ 반드시 필요
import { ReactNode } from 'react';

export const metadata = {
  title: '헌법 게임',
  description: 'O/X 퀴즈로 헌법 공부하기',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
