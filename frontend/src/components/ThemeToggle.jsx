import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

// floating = fixed top-right button (for pages without a Navbar: login, register, profile setup)
export default function ThemeToggle({ floating = false, className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-line/[0.06] transition-colors focus-ring ${
        floating ? "fixed top-4 right-4 z-40 bg-surface border border-line/10 shadow-card" : ""
      } ${className}`}
    >
      {isDark ? <Sun size={17} strokeWidth={2.1} /> : <Moon size={17} strokeWidth={2.1} />}
    </button>
  );
}
