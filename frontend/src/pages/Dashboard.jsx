import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Footprints, Moon, Droplets, HeartPulse, Weight, Scale, Target, ArrowRight, ArrowUpRight, Lightbulb, Stethoscope, Dumbbell, Salad, FileText, Plus } from "lucide-react";
import { dashboardApi, trackerApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useChartColors } from "../context/ThemeContext";
import { Card } from "../components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { ChipToggle } from "../components/ui/Field";

const GOAL_LABELS = { lose_weight: "Lose Weight", gain_muscle: "Gain Muscle", maintain: "Maintain Weight", general_fitness: "General Fitness" };
const FACTOR_LABELS = { steps: "Steps", sleep: "Sleep", hydration: "Hydration", exercise: "Exercise", heartRate: "Heart rate", bloodPressure: "Blood pressure", bmi: "BMI" };

// What to do about the weakest factor, and where in the app to do it
const FOCUS = {
  steps: ["A 20-minute walk adds about 2,000 steps.", "/fitness-planner", "See fitness plan"],
  exercise: ["Even 20 minutes of movement counts today.", "/fitness-planner", "See fitness plan"],
  sleep: ["Aim for 7–8 hours and keep a fixed bedtime.", "/tracker", "Update your log"],
  hydration: ["Keep a bottle nearby and sip every hour.", "/tracker", "Update your log"],
  bmi: ["Small, steady changes beat crash diets.", "/meal-planner", "See meal plan"],
  heartRate: ["Rest, breathe slowly, then re-check your pulse.", "/disease-risk", "Check your risk"],
  bloodPressure: ["Go easy on salt and re-check when you're calm.", "/disease-risk", "Check your risk"],
};

const TARGETS = { steps: 10000, sleep: 8, water: 2.5 };
const pct = (v, t) => (v === null || v === undefined ? 0 : Math.min(100, Math.round((v / t) * 100)));
const tone = (s) => (s < 40 ? "coral" : s < 70 ? "amber" : "mint");
const BAR = { coral: "bg-coral-400", amber: "bg-amber-400", mint: "bg-mint-400" };
const RING = { coral: "rgb(var(--c-coral-500))", amber: "rgb(var(--c-amber-500))", mint: "rgb(var(--c-mint-500))" };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Tile({ icon: Icon, label, value, unit, sub, progress, color = "brand" }) {
  const c = { brand: ["bg-brand-50 text-brand-600 ring-brand-100", "bg-brand-400"], mint: ["bg-mint-50 text-mint-600 ring-mint-100", "bg-mint-400"], coral: ["bg-coral-50 text-coral-500 ring-coral-100", "bg-coral-400"], amber: ["bg-amber-50 text-amber-500 ring-amber-100", "bg-amber-400"] }[color];
  return (
    <div className="bg-surface rounded-2xl border border-line/[0.04] shadow-card p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className={`w-9 h-9 rounded-xl ring-1 grid place-items-center ${c[0]}`}>
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <span className="text-xs font-medium text-muted">{label}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-ink leading-none">
        {value ?? "—"}
        {unit && value !== null && value !== undefined && <span className="text-xs font-normal text-muted ml-1">{unit}</span>}
      </p>
      {progress !== undefined ? (
        <div>
          <div className="h-1.5 rounded-full bg-line/[0.06] overflow-hidden">
            <div className={`h-full rounded-full ${c[1]}`} style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[11px] text-muted mt-1.5">{sub}</p>
        </div>
      ) : (
        <p className="text-[11px] text-muted">{sub || "\u00A0"}</p>
      )}
    </div>
  );
}

const LINKS = [
  { to: "/disease-risk", icon: Stethoscope, title: "Disease risk", text: "Check your diabetes risk" },
  { to: "/fitness-planner", icon: Dumbbell, title: "Fitness plan", text: "Your weekly workouts" },
  { to: "/meal-planner", icon: Salad, title: "Meal plan", text: "Calories and macros" },
  { to: "/health-report", icon: FileText, title: "Health report", text: "Download as PDF" },
];

export default function Dashboard() {
  const chart = useChartColors();
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metric, setMetric] = useState("weight_kg");

  useEffect(() => {
    Promise.all([dashboardApi.summary(), trackerApi.history(14)])
      .then(([s, h]) => {
        setSummary(s);
        setHistory(h.logs || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(
    () => [
      { key: "weight_kg", label: "Weight", unit: "kg", color: chart.weight },
      { key: "steps", label: "Steps", unit: "", color: chart.steps },
      { key: "sleepHours", label: "Sleep", unit: "hrs", color: chart.fat },
      { key: "waterIntakeL", label: "Water", unit: "L", color: chart.weight },
      { key: "heartRate", label: "Heart rate", unit: "bpm", color: "#F27A5C" },
    ],
    [chart]
  );

  if (loading) return <div className="py-16"><LoadingState label="Loading your dashboard…" /></div>;
  if (error) return <ErrorState message={error} />;

  const { profile, todayLog, healthScore, healthScoreBreakdown } = summary;
  const firstName = (profile.name || user?.name || "").split(" ")[0];
  const m = metrics.find((x) => x.key === metric);
  const series = history.filter((h) => h[metric] !== null && h[metric] !== undefined).map((h) => ({ date: h.date?.slice(5), value: h[metric] }));
  const change = series.length >= 2 ? +(series[series.length - 1].value - series[0].value).toFixed(1) : null;
  const weights = history.filter((h) => h.weight_kg != null);
  const weightDelta = weights.length >= 2 ? +(weights[weights.length - 1].weight_kg - weights[0].weight_kg).toFixed(1) : null;
  const weakest = healthScoreBreakdown?.length ? [...healthScoreBreakdown].sort((a, b) => a.score - b.score)[0] : null;
  const focus = weakest ? FOCUS[weakest.factor] : null;
  const st = healthScore === null ? "mint" : tone(healthScore);

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="text-sm text-muted mt-1">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        <div className="flex items-center gap-2">
          {profile.fitnessGoal && (
            <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-2 rounded-full">
              <Target size={13} /> {GOAL_LABELS[profile.fitnessGoal] || profile.fitnessGoal}
            </span>
          )}
          <Link to="/tracker" className="inline-flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-xs font-semibold px-4 py-2 hover:brightness-110 transition focus-ring">
            <Plus size={14} /> {todayLog ? "Update today's log" : "Log today"}
          </Link>
        </div>
      </div>

      {/* Score + focus */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          {healthScore === null ? (
            <EmptyState label="Log your health data today to see your health score." action={<Link to="/tracker" className="text-sm font-semibold text-brand-500 hover:underline">Go to Tracker</Link>} />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-7">
              <div className="w-40 h-40 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(${RING[st]} ${healthScore * 3.6}deg, rgb(var(--c-track)) 0deg)` }}>
                <div className="w-32 h-32 rounded-full bg-surface flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-bold text-ink leading-none">{healthScore}</span>
                  <span className="text-[11px] text-muted mt-1">out of 100</span>
                </div>
              </div>
              <div className="flex-1 w-full">
                <h2 className="font-display text-xl font-bold text-ink">{healthScore >= 70 ? "You're doing great today" : healthScore >= 40 ? "Room to improve today" : "Let's build some momentum"}</h2>
                <p className="text-sm text-muted mt-1 mb-4">Based on today's steps, sleep, water, exercise, vitals and BMI.</p>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2.5">
                  {healthScoreBreakdown.map((f) => (
                    <div key={f.factor} className="flex items-center gap-2.5">
                      <span className="text-xs text-muted w-24 shrink-0">{FACTOR_LABELS[f.factor] || f.factor}</span>
                      <span className="flex-1 h-2 rounded-full bg-line/[0.06] overflow-hidden">
                        <span className={`block h-full rounded-full ${BAR[tone(f.score)]}`} style={{ width: `${f.score}%` }} />
                      </span>
                      <span className="text-xs font-mono text-ink w-7 text-right">{f.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <p className="flex items-center gap-2 text-sm font-semibold text-ink mb-3">
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 ring-1 ring-amber-100 grid place-items-center"><Lightbulb size={16} /></span>
            Today's focus
          </p>
          {weakest && focus ? (
            <>
              <p className="font-display text-lg font-bold text-ink">Improve your {(FACTOR_LABELS[weakest.factor] || weakest.factor).toLowerCase()}</p>
              <p className="text-xs text-muted mt-0.5">Lowest score right now: {weakest.score}/100</p>
              <p className="text-sm text-muted mt-3">{focus[0]}</p>
              <Link to={focus[1]} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:underline">
                {focus[2]} <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted">Log today's steps, sleep and water and we'll point out the one habit that will lift your score the most.</p>
          )}
        </Card>
      </div>

      {/* Today tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Tile icon={Footprints} label="Steps" color="mint" value={todayLog?.steps?.toLocaleString()} progress={pct(todayLog?.steps, TARGETS.steps)} sub={`${pct(todayLog?.steps, TARGETS.steps)}% of ${TARGETS.steps.toLocaleString()}`} />
        <Tile icon={Moon} label="Sleep" color="brand" value={todayLog?.sleepHours} unit="hrs" progress={pct(todayLog?.sleepHours, TARGETS.sleep)} sub={`Goal ${TARGETS.sleep} hrs`} />
        <Tile icon={Droplets} label="Water" color="brand" value={todayLog?.waterIntakeL} unit="L" progress={pct(todayLog?.waterIntakeL, TARGETS.water)} sub={`Goal ${TARGETS.water} L`} />
        <Tile icon={HeartPulse} label="Heart rate" color="coral" value={todayLog?.heartRate} unit="bpm" sub={todayLog?.bp_systolic ? `BP ${todayLog.bp_systolic}/${todayLog.bp_diastolic}` : "Resting"} />
        <Tile icon={Weight} label="Weight" color="brand" value={todayLog?.weight_kg} unit="kg" sub={weightDelta === null ? "Log 2+ days to see change" : `${weightDelta > 0 ? "+" : ""}${weightDelta} kg in ${weights.length} logs`} />
        <Tile icon={Scale} label="BMI" color="amber" value={profile.bmi} sub={profile.bmiCategory} />
      </div>

      {/* Trend */}
      <Card
        title="Your trend"
        actions={<div className="flex flex-wrap gap-1.5 justify-end">{metrics.map((x) => <ChipToggle key={x.key} selected={metric === x.key} onClick={() => setMetric(x.key)}>{x.label}</ChipToggle>)}</div>}
      >
        {series.length < 2 ? (
          <EmptyState label={`Log ${m.label.toLowerCase()} on at least 2 days in the Tracker to see your trend.`} />
        ) : (
          <>
            <p className="text-sm text-muted mb-3">
              Latest <span className="font-mono font-semibold text-ink">{series[series.length - 1].value.toLocaleString()} {m.unit}</span>
              {change !== null && <> · <span className="font-mono">{change > 0 ? "+" : ""}{change.toLocaleString()} {m.unit}</span> over {series.length} days</>}
            </p>
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ left: -10, right: 10, top: 5 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={m.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: chart.tick }} stroke={chart.tick} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: chart.tick }} stroke={chart.tick} tickLine={false} domain={["auto", "auto"]} />
                  <Tooltip
                    formatter={(v) => [`${v} ${m.unit}`, m.label]}
                    contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8, color: chart.tooltipText }}
                    labelStyle={{ color: chart.tooltipText }}
                  />
                  <Area type="monotone" dataKey="value" stroke={m.color} strokeWidth={2.5} fill="url(#trendFill)" dot={{ r: 3, fill: m.color }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {LINKS.map(({ to, icon: Icon, title, text }) => (
          <Link key={to} to={to} className="group bg-surface rounded-2xl border border-line/[0.04] shadow-card hover:shadow-cardHover p-4 flex items-center gap-3 transition-shadow focus-ring">
            <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 grid place-items-center shrink-0"><Icon size={18} strokeWidth={2.2} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-ink">{title}</span>
              <span className="block text-xs text-muted truncate">{text}</span>
            </span>
            <ArrowUpRight size={16} className="text-muted group-hover:text-brand-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
