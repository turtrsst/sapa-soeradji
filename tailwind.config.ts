import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        rst: {
          50: "#effaf7", 100: "#d7f3ea", 200: "#b0e6d7", 300: "#7dd2c2",
          400: "#45b8aa", 500: "#269d92", 600: "#1f7f78", 700: "#1d6661",
          800: "#1d524f", 900: "#1c443f", 950: "#0a2523",
        },
        gold: { 400: "#f2c14e", 500: "#e3a857", 600: "#c8873a" },
      },
      fontFamily: { sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"] },
      boxShadow: { soft: "0 10px 30px -12px rgba(10, 37, 35, 0.45)" },
    },
  },
  plugins: [],
};
export default config;
