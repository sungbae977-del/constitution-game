export const metadata = {
  title: '헌법게임',
  description: '엑셀 업로드 기반 OX 헌법 학습 게임'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
