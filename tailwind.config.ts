import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import lineClamp from "@tailwindcss/line-clamp";
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./ui/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mainred: "#B52934",
        "red-bg": "rgba(181,41,52,0.5)", // nền mờ 50%
        "red-main": "#B52934",
        "input-text": "#ffffff",
        "custom-white": "#ffffff",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
      },
      borderRadius: {
        xl: "1rem",
        lg: "0.75rem",
        sm: "0.5rem",
      },
      boxShadow: {
        login: "0 4px 32px 0 rgba(0, 0, 0, 0.2)",
      },
      fontSize: {
        "login-title": "1.8rem",
        "login-btn": "1rem",
      },
    },
  },
  plugins: [tailwindcssAnimate, lineClamp],
};

export default config;
