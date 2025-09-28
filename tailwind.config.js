/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#e6fff5', // 연한 민트 배경색
        card: '#ffffff',       // 카드용 흰색 배경
        correct: '#16a34a',    // 정답 - 초록
        incorrect: '#dc2626',  // 오답 - 빨강
        explanation: '#fef9c3' // 해설 - 연노랑
      }
    }
  },
  plugins: [],
}
