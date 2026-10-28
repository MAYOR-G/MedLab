import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7FAFC",
        surface: {
          DEFAULT: "#FFFFFF",
          elevated: "#FFFFFF",
          subtle: "#F1F5F9",
          disabled: "#E8EDF3",
        },
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          pressed: "#1E40AF",
          tint: "#EFF6FF",
          text: "#172B4D",
        },
        text: {
          primary: "#172B4D",
          secondary: "#64748B",
          tertiary: "#8491A5",
          disabled: "#8491A5",
        },
        border: {
          DEFAULT: "#DCE5EF",
          strong: "#C5D1DF",
        },
        semantic: {
          success: {
            text: "#166534",
            bg: "#F0FDF4",
            border: "#BBF7D0",
          },
          info: {
            text: "#1D4ED8",
            bg: "#EFF6FF",
            border: "#BFDBFE",
          },
          warning: {
            text: "#92400E",
            bg: "#FFFBEB",
            border: "#FDE68A",
          },
          error: {
            text: "#B91C1C",
            bg: "#FEF2F2",
            border: "#FECACA",
          },
        },
        ai: {
          bg: "#F0F7FF",
          border: "#D6E8FF",
          label: "#1D4ED8",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
        button: "10px",
        badge: "8px",
        input: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
