/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        peach: "#FFD5C2",
        wine: "#8B1E3F",
        cream: "#F0E7D8",
        rose: "#CE6D8B",
        sand: "#DDC9B4",
        surface: "#ffffff",
        text: "#222222",
        border: "#cccccc",
        backdrop: "#f5f5f5",
      },
      fontFamily: {
        abhaya: ['"Abhaya Libre"', "serif"],
      },
      boxShadow: {
        card: "0 12px 30px rgba(139, 30, 63, 0.12)",
        soft: "0 8px 24px rgba(34, 34, 34, 0.1)",
      },
    },
  },
  plugins: [],
};
