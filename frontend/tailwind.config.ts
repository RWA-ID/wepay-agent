import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        wepay: {
          DEFAULT: "#7C3AED",    // violet-700 — primary brand
          light:   "#8B5CF6",    // violet-500
          dim:     "#2E1065",    // violet-950
          border:  "#4C1D95",    // violet-900
        },
      },
      fontFamily: {
        heading: ["Syne", "sans-serif"],
        mono:    ["DM Mono", "monospace"],
        sans:    ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        wepay:    "0 0 20px rgba(124, 58, 237, 0.25)",
        "wepay-lg": "0 0 40px rgba(124, 58, 237, 0.35)",
      },
    },
  },
  plugins: [],
} satisfies Config;
