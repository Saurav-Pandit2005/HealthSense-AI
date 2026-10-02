import { Link } from "react-router-dom";
import { HeartPulse, ClipboardList, Stethoscope, Dumbbell, Salad, FileText, ShieldCheck, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

const ECG = "M0 70 H300 l12 -6 l12 6 H380 l8 0 l10 -62 l16 112 l12 -66 l10 16 H520 l14 -10 l18 10 H1000";

function Ring({ value, size, thick, color, inner = "rgb(var(--c-surface))", track = "rgb(var(--c-track))", children }) {
  return (
    <div
      className="rounded-full grid place-items-center shrink-0"
      style={{ width: size, height: size, background: `conic-gradient(${color} ${value * 3.6}deg, ${track} 0deg)` }}
    >
      <div className="rounded-full grid place-items-center" style={{ width: size - thick * 2, height: size - thick * 2, background: inner }}>
        {children}
      </div>
    </div>
  );
}

function Monitor() {
  const rows = [
    ["Heart rate", "72", "bpm", "#F27A5C"],
    ["Steps", "8,420", "", "#34D6A9"],
    ["Sleep", "7.5", "hrs", "#4DB0AC"],
    ["Water", "2.4", "L", "#4DB0AC"],
  ];
  return (
    <div className="relative">
      <div className="rounded-3xl p-5 sm:p-6 shadow-cardHover border border-white/10" style={{ background: "#0A1B22", color: "#E6EDF7" }}>
        <div className="flex items-center gap-5">
          <Ring value={82} size={118} thick={11} color="#34D6A9" inner="#0A1B22" track="#1B3340">
            <div className="text-center">
              <div className="font-mono text-4xl font-bold leading-none">82</div>
              <div className="text-[11px] mt-1" style={{ color: "#8FA3B8" }}>health score</div>
            </div>
          </Ring>
          <div className="flex-1 space-y-2.5">
            {rows.map(([k, v, u, c]) => (
              <div key={k} className="flex items-baseline justify-between border-b border-white/10 pb-1.5 last:border-0">
                <span className="text-xs" style={{ color: "#8FA3B8" }}>{k}</span>
                <span className="font-mono text-lg font-semibold" style={{ color: c }}>
                  {v} <span className="text-[11px] font-normal" style={{ color: "#8FA3B8" }}>{u}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
        <svg viewBox="0 0 1000 120" className="w-full h-16 mt-4" fill="none" stroke="#34D6A9" strokeWidth="3" strokeLinejoin="round">
          <path d={ECG} opacity=".85" />
        </svg>
      </div>
      <div className="absolute -bottom-5 -left-3 sm:-left-8 rotate-[-3deg] flex items-center gap-3 rounded-2xl bg-surface border border-line/10 shadow-cardHover px-4 py-3">
        <Ring value={12} size={44} thick={6} color="rgb(var(--c-mint-500))">
          <span className="w-0" />
        </Ring>
        <div>
          <p className="text-sm font-semibold text-ink leading-tight">Diabetes risk: Low</p>
          <p className="text-xs text-muted">12% based on your latest readings</p>
        </div>
      </div>
    </div>
  );
}

const box = "rounded-3xl bg-surface border border-line/[0.06] shadow-card p-6 overflow-hidden";

function Feature({ icon: Icon, title, text, children, className = "" }) {
  return (
    <div className={`${box} flex flex-col ${className}`}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 grid place-items-center">
          <Icon size={18} strokeWidth={2.2} />
        </span>
        <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
      </div>
      <p className="text-sm text-muted max-w-[46ch]">{text}</p>
      <div className="mt-auto pt-5">{children}</div>
    </div>
  );
}

const FACTORS = [
  ["Steps", 86],
  ["Sleep", 74],
  ["Hydration", 62],
  ["Exercise", 90],
  ["Blood pressure", 78],
];
const WEEK = [["M", "bg-brand-400"], ["T", "bg-amber-400"], ["W", "bg-coral-400"], ["T", "bg-brand-400"], ["F", "bg-amber-400"], ["S", "bg-mint-400"], ["S", "bg-line/20"]];
const BARS = [38, 62, 48, 80, 70, 92, 66];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? { to: "/dashboard", label: "Open your dashboard" } : { to: "/register", label: "Create your account" };

  return (
    <div className="min-h-screen bg-canvas text-ink font-body overflow-x-hidden">
      <style>{`@keyframes ecgdraw{to{stroke-dashoffset:0}} .ecg{stroke-dasharray:1;stroke-dashoffset:1;animation:ecgdraw 2.8s cubic-bezier(.4,0,.2,1) .2s forwards}`}</style>

      <header className="sticky top-0 z-30 bg-canvas/80 backdrop-blur border-b border-line/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="focus-ring rounded-lg">
            <Logo size={32} />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <a href="#features" className="hover:text-ink transition-colors">What you get</a>
            <a href="#how" className="hover:text-ink transition-colors">How it works</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user && (
              <Link to="/login" className="hidden sm:inline-flex px-3 py-2 text-sm font-semibold text-muted hover:text-ink focus-ring rounded-lg">
                Log in
              </Link>
            )}
            <Link to={cta.to} className="inline-flex items-center rounded-lg bg-brand-500 text-white px-4 py-2 text-sm font-semibold hover:brightness-110 transition focus-ring">
              {user ? "Dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-brand-300/20 blur-3xl pointer-events-none" />
        <div className="absolute top-20 right-0 w-[360px] h-[360px] rounded-full bg-mint-400/15 blur-3xl pointer-events-none" />
        <svg viewBox="0 0 1000 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-x-0 bottom-0 w-full h-40 text-brand-400/40 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round">
          <path className="ecg" pathLength="1" d={ECG} />
        </svg>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-40 lg:pt-20 lg:pb-44 grid lg:grid-cols-[1.1fr_0.9fr] gap-14 items-center">
          <div>
            <h1 className="font-display font-bold text-ink text-[2.6rem] sm:text-6xl lg:text-[3.9rem] leading-[1.04] tracking-[-0.035em]" style={{ textWrap: "balance" }}>
              Know what your body is telling you.
            </h1>
            <p className="mt-6 text-lg text-muted max-w-[48ch] leading-relaxed">
              Log your day in a minute. HealthSense AI turns steps, sleep, heart rate and blood pressure into a daily health score, an early risk check, and plans for what to eat and how to train.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to={cta.to} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 text-white px-6 py-3.5 font-semibold shadow-card hover:brightness-110 transition focus-ring">
                {cta.label} <ArrowRight size={17} />
              </Link>
              {!user && (
                <Link to="/login" className="inline-flex items-center rounded-xl border border-line/15 bg-surface px-6 py-3.5 font-semibold text-ink hover:border-brand-300 transition-colors focus-ring">
                  I already have an account
                </Link>
              )}
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <ShieldCheck size={16} className="text-mint-500" /> Wellness insights, not a diagnosis. Your data stays in your account.
            </p>
          </div>
          <Monitor />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight max-w-[22ch]">Everything you need to understand your health in one place</h2>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-6 gap-4">
          <Feature icon={HeartPulse} title="A daily health score" text="One number out of 100, built from your steps, sleep, hydration, exercise, heart rate, blood pressure and BMI. See which habit is pulling it down." className="lg:col-span-4">
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {FACTORS.map(([k, v]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="w-28 text-xs text-muted shrink-0">{k}</span>
                  <span className="flex-1 h-2 rounded-full bg-line/[0.06] overflow-hidden">
                    <span className="block h-full rounded-full bg-brand-400" style={{ width: `${v}%` }} />
                  </span>
                  <span className="w-7 text-right font-mono text-xs">{v}</span>
                </div>
              ))}
            </div>
          </Feature>

          <Feature icon={Stethoscope} title="Early risk check" text="Enter your clinical numbers and get a risk level with the factors behind it." className="lg:col-span-2">
            <div className="flex items-center gap-4">
              <Ring value={34} size={72} thick={9} color="rgb(var(--c-amber-500))">
                <span className="font-mono text-sm font-bold">34%</span>
              </Ring>
              <span className="text-xs font-semibold rounded-full border border-amber-100 bg-amber-50 text-amber-500 px-2.5 py-1">Moderate risk</span>
            </div>
          </Feature>

          <Feature icon={ClipboardList} title="Daily tracker" text="Weight, steps, sleep, water and heart rate, logged in under a minute." className="lg:col-span-2">
            <div className="flex items-end gap-1.5 h-14">
              {BARS.map((h, i) => (
                <span key={i} className={`flex-1 rounded-md ${i === 5 ? "bg-brand-500" : "bg-brand-100"}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </Feature>

          <Feature icon={Dumbbell} title="Fitness plan" text="A weekly routine matched to your goal and fitness level." className="lg:col-span-2">
            <div className="flex gap-1.5">
              {WEEK.map(([d, c], i) => (
                <span key={i} className="flex-1 rounded-lg border border-line/10 py-1.5 text-center">
                  <span className="block text-[11px] text-muted">{d}</span>
                  <span className={`mx-auto mt-1 block w-2 h-2 rounded-full ${c}`} />
                </span>
              ))}
            </div>
          </Feature>

          <Feature icon={Salad} title="Meal plan" text="A calorie target and macro split, with meals that fit your diet." className="lg:col-span-2">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="font-mono text-2xl font-bold text-brand-600">2,150</span>
              <span className="text-xs text-muted">kcal a day</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden">
              <span className="bg-brand-500" style={{ width: "30%" }} />
              <span className="bg-mint-400" style={{ width: "45%" }} />
              <span className="bg-amber-400" style={{ width: "25%" }} />
            </div>
            <p className="mt-2 text-xs text-muted">Protein 30% · Carbs 45% · Fat 25%</p>
          </Feature>

          <div className={`${box} lg:col-span-6 flex flex-col sm:flex-row sm:items-center gap-4 !py-5`}>
            <span className="w-11 h-11 rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 grid place-items-center shrink-0">
              <FileText size={20} strokeWidth={2.2} />
            </span>
            <div className="flex-1">
              <h3 className="font-display text-lg font-bold">A report you can take to your doctor</h3>
              <p className="text-sm text-muted">Download your profile, trends, risk results and plans as a single PDF.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-16">
        <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Set up once, check in daily</h2>
        <ol className="mt-10 grid md:grid-cols-3 gap-8 relative">
          {[
            ["1", "Tell us about you", "Age, height, weight, allergies and your goal. It takes about two minutes."],
            ["2", "Log your day", "Add steps, sleep, water and vitals. Your score updates as you go."],
            ["3", "Act on the results", "Follow your fitness and meal plans, and re-check your risk whenever you have new readings."],
          ].map(([n, t, d]) => (
            <li key={n} className="flex gap-4">
              <span className="w-10 h-10 rounded-full bg-brand-500 text-white grid place-items-center font-display font-bold shrink-0">{n}</span>
              <div>
                <h3 className="font-display text-lg font-bold">{t}</h3>
                <p className="text-sm text-muted mt-1 max-w-[34ch]">{d}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="relative overflow-hidden rounded-[2rem] bg-brand-500 text-white px-6 sm:px-12 py-14">
          <svg viewBox="0 0 1000 120" preserveAspectRatio="xMidYMid slice" className="absolute inset-x-0 bottom-4 w-full h-28 opacity-20" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round">
            <path d={ECG} />
          </svg>
          <div className="relative">
            <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight max-w-[20ch]">Your first health score is one log away.</h2>
            <p className="mt-3 text-white/80 max-w-[44ch]">Create your profile, log today, and see where you stand.</p>
            <Link to={cta.to} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white text-brand-600 px-6 py-3.5 font-semibold hover:bg-white/90 transition focus-ring">
              {cta.label} <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/[0.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted">
          <Logo size={26} />
          <p className="max-w-[60ch]">HealthSense AI gives general wellness information and is not a substitute for professional medical advice.</p>
        </div>
      </footer>
    </div>
  );
}
