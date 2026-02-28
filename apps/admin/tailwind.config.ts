import * as lineClamp from "@tailwindcss/line-clamp";
import type { Config } from "tailwindcss";
import * as tailwindcssAnimate from "tailwindcss-animate";
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "../../packages/ui/src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Van Lang University Primary
        mainred: "#8B1A1A",
        "vl-primary": {
          DEFAULT: "#8B1A1A",
          light: "#A63D3D",
          soft: "#FBE9E9",
        },
        // Semantic Colors
        "vl-success": {
          DEFAULT: "#16A34A",
          soft: "#DCFCE7",
        },
        "vl-warning": {
          DEFAULT: "#D97706",
          soft: "#FEF3C7",
        },
        "vl-danger": {
          DEFAULT: "#DC2626",
          soft: "#FEE2E2",
        },
        "vl-info": {
          DEFAULT: "#0891B2",
          soft: "#CFFAFE",
        },
        // Legacy compatibility
        "red-bg": "rgba(139,26,26,0.5)",
        "red-main": "#8B1A1A",
        "input-text": "#ffffff",
        "custom-white": "#ffffff",
        // shadcn/ui tokens
        // border: "hsl(var(--border))",
        // input: "hsl(var(--input))",
        // ring: "hsl(var(--ring))",
        // background: "hsl(var(--background))",
        // foreground: "hsl(var(--foreground))",
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
