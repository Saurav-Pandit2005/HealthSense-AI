import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { HeartPulse, LayoutDashboard, ClipboardList, Stethoscope, Dumbbell, Salad, FileText, Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Field";

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
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-black/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand-500 text-white flex items-center justify-center">
              <HeartPulse size={17} strokeWidth={2.4} />
            </div>
            <span className="font-display font-bold text-ink text-[15px] hidden sm:inline">HealthSense AI</span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-ring ${
                    isActive ? "bg-brand-50 text-brand-600" : "text-muted hover:text-ink hover:bg-black/[0.03]"
                  }`
                }
              >
                <item.icon size={15} strokeWidth={2.1} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3 shrink-0">
            <span className="text-sm text-muted">{user?.name}</span>
            <Button variant="outline" onClick={handleLogout} className="!py-2">
              Logout
            </Button>
          </div>

          <button className="lg:hidden text-ink" onClick={() => setMobileOpen((o) => !o)} aria-label="Toggle menu">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
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
                      isActive ? "bg-brand-50 text-brand-600" : "text-muted hover:bg-black/[0.03]"
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
