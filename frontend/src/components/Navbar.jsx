import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import { LayoutDashboard, ClipboardList, Stethoscope, Dumbbell, Salad, FileText, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Field";
import ThemeToggle from "./ThemeToggle";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tracker", label: "Tracker", icon: ClipboardList },
  { to: "/disease-risk", label: "Disease Risk", icon: Stethoscope },
  { to: "/fitness-planner", label: "Fitness Plan", icon: Dumbbell },
  { to: "/meal-planner", label: "Meal Plan", icon: Salad },
  { to: "/health-report", label: "Health Report", icon: FileText },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-line/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center shrink-0">
            <Logo size={32} textClassName="hidden sm:inline-flex" />
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
                    isActive ? "bg-brand-50 text-brand-600" : "text-muted hover:text-ink hover:bg-line/[0.03]"
                  }`
                }
              >
                <item.icon size={15} strokeWidth={2.1} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <ThemeToggle />
            <span className="text-sm text-muted">{user?.name}</span>
            <Button variant="outline" onClick={handleLogout} className="!py-2">
              Logout
            </Button>
          </div>

          <div className="lg:hidden flex items-center gap-1">
            <ThemeToggle />
            <button className="text-ink p-1.5" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden pb-4 animate-fadeUp">
            <nav className="flex flex-col gap-1 mb-3">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? "bg-brand-50 text-brand-600" : "text-muted hover:bg-line/[0.03]"
                    }`
                  }
                >
                  <item.icon size={16} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="flex items-center justify-between px-3">
              <span className="text-sm text-muted">{user?.name}</span>
              <Button variant="outline" onClick={handleLogout} className="!py-2">
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
