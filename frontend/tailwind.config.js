/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "rgb(var(--c-ink) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        canvas: "rgb(var(--c-canvas) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        // "line" = black in light mode, white in dark mode (for borders / subtle overlays)
        line: "rgb(var(--c-line) / <alpha-value>)",
        brand: {
          50: "rgb(var(--c-brand-50) / <alpha-value>)",
          100: "rgb(var(--c-brand-100) / <alpha-value>)",
          200: "rgb(var(--c-brand-200) / <alpha-value>)",
          300: "rgb(var(--c-brand-300) / <alpha-value>)",
          400: "rgb(var(--c-brand-400) / <alpha-value>)",
          500: "rgb(var(--c-brand-500) / <alpha-value>)",
          600: "rgb(var(--c-brand-600) / <alpha-value>)",
          700: "rgb(var(--c-brand-700) / <alpha-value>)",
        },
        mint: {
          50: "rgb(var(--c-mint-50) / <alpha-value>)",
          100: "rgb(var(--c-mint-100) / <alpha-value>)",
          400: "rgb(var(--c-mint-400) / <alpha-value>)",
          500: "rgb(var(--c-mint-500) / <alpha-value>)",
          600: "rgb(var(--c-mint-600) / <alpha-value>)",
        },
        coral: {
          50: "rgb(var(--c-coral-50) / <alpha-value>)",
          100: "rgb(var(--c-coral-100) / <alpha-value>)",
          400: "rgb(var(--c-coral-400) / <alpha-value>)",
          500: "rgb(var(--c-coral-500) / <alpha-value>)",
          600: "rgb(var(--c-coral-600) / <alpha-value>)",
        },
        amber: {
          50: "rgb(var(--c-amber-50) / <alpha-value>)",
          100: "rgb(var(--c-amber-100) / <alpha-value>)",
          400: "rgb(var(--c-amber-400) / <alpha-value>)",
          500: "rgb(var(--c-amber-500) / <alpha-value>)",
        },
      },
      fontFamily: {
        display: ["'Manrope'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--c-shadow) / 0.04), 0 8px 24px -12px rgb(var(--c-shadow) / var(--shadow-strength))",
        cardHover: "0 4px 12px rgb(var(--c-shadow) / 0.06), 0 18px 36px -16px rgb(var(--c-shadow) / calc(var(--shadow-strength) + 0.06))",
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
