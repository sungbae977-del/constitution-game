/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#e6fffa",   // 민트톤 배경
        card: "#ffffff",        // 카드 배경 (흰색)
        explanation: "#fef9c3", // 연노랑 (해설 박스)
        correct: "#16a34a",     // 초록 (정답)
        incorrect: "#dc2626",   // 빨강 (오답)
      },
    },
  },
  plugins: [],
};
