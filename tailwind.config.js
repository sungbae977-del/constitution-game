/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 굳이 커스텀 컬러를 안 써도 되지만, 원하시면 추가
      colors: {
        mint: {
          50:  '#E6FBF4',
          100: '#CCF7E9',
        },
      },
      boxShadow: {
        card: "0 10px 25px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        '2xl': '1rem'
      }
    },
  },
  plugins: [],
};
