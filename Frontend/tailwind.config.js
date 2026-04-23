import { themeConfig } from "./src/config/theme.js";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: themeConfig.colors.brand,
        accent: themeConfig.colors.accent,
        success: themeConfig.colors.success,
        warning: themeConfig.colors.warning,
        danger: themeConfig.colors.danger,
        surface: themeConfig.colors.surface,
        stroke: themeConfig.colors.stroke,
      },
      boxShadow: {
        glow: "0 24px 80px rgba(15, 23, 42, 0.45)",
        glass: "0 20px 80px rgba(15, 23, 42, 0.35)",
      },
      backdropBlur: {
        xs: "2px",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.65" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        float: "float 8s ease-in-out infinite",
        fadeUp: "fadeUp 0.45s ease-out",
        pulseSoft: "pulseSoft 1.8s ease-in-out infinite",
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
