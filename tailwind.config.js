/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/p2play-core/dist/**/*.{js,mjs}",
  ],
  theme: {
    extend: {
      colors: {
        millions: {
          bg: "#050b18",
          card: "#0b1736",
          border: "#1d3268",
          gold: "#f59e0b",
          goldHover: "#d97706",
          orange: "#ea580c",
          blueDark: "#070e24",
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
