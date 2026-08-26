/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        muted: "#5B6B82",
        canvas: "#F4F7FB",
        surface: "#FFFFFF",
        brand: {
          50: "#EAF4F4",
          100: "#CFE6E6",
          200: "#9FCDCD",
          300: "#6BB2B2",
          400: "#3D9797",
          500: "#146C6C",
          600: "#0F5757",
          700: "#0B4242",
        },
        mint: {
          50: "#E7FBF3",
          100: "#C6F5E1",
          400: "#22C99B",
          500: "#17AB83",
          600: "#12896A",
        },
        coral: {
          50: "#FFEEEA",
          100: "#FFD5C9",
          400: "#F0603D",
          500: "#DB4A28",
          600: "#B93B1F",
        },
        amber: {
          50: "#FFF6E5",
          100: "#FFE7B8",
          400: "#E8A63C",
          500: "#CC8A1F",
        },
      },
      fontFamily: {
        display: ["'Manrope'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)",
        cardHover: "0 4px 12px rgba(15,23,42,0.06), 0 18px 36px -16px rgba(15,23,42,0.16)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.35s ease-out",
      },
    },
  },
  plugins: [],
};
