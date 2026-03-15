/** @type {import("tailwindcss").Config} */
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          ...defaultTheme.fontFamily.sans,
        ],
        display: [
          '"Bebas Neue"',
          'sans-serif',
        ],
        mono: ['"Fira Code"', ...defaultTheme.fontFamily.mono],
      },
      fontSize: {
        display: [
          "clamp(36px, 5vw, 56px)",
          {
            lineHeight: "1.1",
            letterSpacing: "-0.025em",
            fontWeight: "800",
          },
        ],
        heading: [
          "13px",
          {
            lineHeight: "1.3",
            letterSpacing: "0.04em",
            fontWeight: "600",
          },
        ],
        body: [
          "15px",
          {
            lineHeight: "1.5",
            fontWeight: "500",
          },
        ],
        caption: [
          "12px",
          {
            lineHeight: "1.3",
            letterSpacing: "0.03em",
            fontWeight: "500",
          },
        ],
      },
      colors: {
        flat: {
          primary: "#2563EB",
          dark: "#1E293B",
          muted: "#64748B",
          dim: "#94A3B8",
          border: "#E2E8F0",
          surface: "#FFFFFF",
          surfaceAlt: "#F8FAFC",
          bg: "#F1F5F9",
        },
        accent: "#F59E0B",
      },
      boxShadow: {
        "flat-card": "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "flat-card-hover": "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)",
        "flat-accent": "0 1px 3px rgba(245, 158, 11, 0.15)",
      },
      backdropBlur: {
        panel: "10px",
      },
      borderRadius: {
        card: "12px",
        btn: "8px",
      },
    },
  },
  plugins: [],
};
