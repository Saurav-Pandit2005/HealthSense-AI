import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "healthsense-theme";
const ThemeContext = createContext(null);

function getInitialTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* ignore */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);

  const value = useMemo(() => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}

// Recharts / inline-SVG can't read Tailwind classes, so charts get their colors from here.
const CHART_LIGHT = {
  grid: "#EAF4F4",
  tick: "#5B6B82",
  weight: "#146C6C",
  steps: "#22C99B",
  protein: "#146C6C",
  carbs: "#22C99B",
  fat: "#E8A63C",
  tooltipBg: "#FFFFFF",
  tooltipBorder: "#E2E8F0",
  tooltipText: "#0F172A",
};

const CHART_DARK = {
  grid: "#26344A",
  tick: "#93A3BA",
  weight: "#4DB0AC",
  steps: "#34D6A9",
  protein: "#4DB0AC",
  carbs: "#34D6A9",
  fat: "#EDB04E",
  tooltipBg: "#111B2B",
  tooltipBorder: "#26344A",
  tooltipText: "#E6EDF7",
};

export function useChartColors() {
  const { isDark } = useTheme();
  return isDark ? CHART_DARK : CHART_LIGHT;
}
