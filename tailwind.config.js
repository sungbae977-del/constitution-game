/** @type {import('tailwindcss').Config} */
module.exports = {
content: [
'./app/**/*.{js,ts,jsx,tsx}',
'./pages/**/*.{js,ts,jsx,tsx}',
'./components/**/*.{js,ts,jsx,tsx}',
],
theme: {
extend: {
colors: {
correct: '#34d399', // Tailwind emerald-400
incorrect: '#f87171', // Tailwind red-400
background: '#f9fafb',
foreground: '#111827',
},
},
},
plugins: [],
};