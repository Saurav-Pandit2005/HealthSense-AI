import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, Lightbulb, Clock, CalendarDays, Moon, Target, Activity, Leaf, Check, ArrowRight } from "lucide-react";
import { fitnessApi } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Field";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";

const GOAL_LABELS = { lose_weight: "Lose Weight", gain_muscle: "Gain Muscle", maintain: "Maintain Weight", general_fitness: "General Fitness" };

// colour per workout type (fixed colours so they look the same in light and dark mode)
const TONES = {
  rest: { bg: "rgba(148,163,184,0.18)", fg: "#94A3B8", icon: Moon },
  strength: { bg: "rgba(232,166,60,0.20)", fg: "#E8A63C", icon: Dumbbell },
  intense: { bg: "rgba(240,96,61,0.18)", fg: "#F0603D", icon: Activity },
  recovery: { bg: "rgba(34,201,155,0.18)", fg: "#22C99B", icon: Leaf },
  cardio: { bg: "rgba(61,151,151,0.22)", fg: "#3D9797", icon: Activity },
};
function toneOf(d) {
  const f = d.focus;
  if (d.durationMinutes === 0 || f.includes("Rest")) return TONES.rest;
  if (f.includes("HIIT")) return TONES.intense;
  if (/Strength|Push|Pull|Legs/.test(f)) return TONES.strength;
  if (/Flexib|Recover|Mobility|Light Activity/.test(f)) return TONES.recovery;
  return TONES.cardio;
}

const TODAY_INDEX = (new Date().getDay() + 6) % 7; // Monday = 0
function weekKey() {
  const d = new Date();
  d.setDate(d.getDate() - TODAY_INDEX);
  const p = (n) => String(n).padStart(2, "0");
  return `healthsense-workouts-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function Ring({ value, total, onDark }) {
  const r = 34, C = 2 * Math.PI * r, pct = total ? value / total : 0;
  return (
    <div style={{ position: "relative", width: 96, height: 96, flexShrink: 0 }}>
      <svg viewBox="0 0 80 80" width="96" height="96" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" style={{ stroke: onDark ? "rgba(255,255,255,0.25)" : "rgb(var(--c-track))" }} />
        {pct > 0 && <circle cx="40" cy="40" r={r} fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${C * pct} ${C}`} style={{ stroke: onDark ? "#fff" : "rgb(var(--c-mint-500))" }} />}
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span className={`font-mono text-xl font-bold leading-none ${onDark ? "text-white" : "text-ink"}`}>{value}/{total}</span>
        <span className={`text-[10px] mt-1 ${onDark ? "text-white/80" : "text-muted"}`}>this week</span>
      </div>
    </div>
  );
}

export default function FitnessPlanner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [selected, setSelected] = useState(TODAY_INDEX);
  const key = useMemo(weekKey, []);
  const [done, setDone] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    fitnessApi.plan()
      .then((d) => setPlan(d.plan))
      .catch((err) => (err.status === 400 ? setNeedsProfile(true) : setError(err.message)))
      .finally(() => setLoading(false));
  }, []);

  function toggleDone(day) {
    setDone((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }

  if (loading) return <div className="py-16"><LoadingState label="Building your fitness plan…" /></div>;
  if (needsProfile) {
    return (
      <Card>
        <EmptyState label="Set your fitness goal in your profile to get a personalized weekly plan."
          action={<Link to="/profile-setup"><Button variant="secondary">Complete Profile</Button></Link>} />
      </Card>
    );
  }
  if (error) return <ErrorState message={error} />;

  const days = plan.weeklyPlan;
  const workouts = days.filter((d) => d.durationMinutes > 0);
  const totalMinutes = days.reduce((s, d) => s + d.durationMinutes, 0);
  const doneWorkouts = workouts.filter((d) => done.includes(d.day));
  const doneMinutes = doneWorkouts.reduce((s, d) => s + d.durationMinutes, 0);

  const day = days[selected];
  const isRest = day.durationMinutes === 0;
  const isDone = done.includes(day.day);
  const tone = toneOf(day);
  const Icon = tone.icon;
  const next = days.slice(selected + 1).find((d) => d.durationMinutes > 0) || workouts[0];

  return (
    <div className="space-y-5 animate-fadeUp">
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">Fitness plan</h1>
          <p className="text-sm text-muted mt-1">Your weekly routine, built for your goal.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-2 rounded-full"><Target size={13} /> {GOAL_LABELS[plan.goal] || plan.goal}</span>
          <Link to="/profile-setup" className="text-xs font-semibold text-muted hover:text-ink hover:underline">Change goal</Link>
        </div>
      </div>

      {/* Hero: selected day (today by default) */}
      <div className="rounded-3xl border border-line/[0.08] shadow-card" style={{ overflow: "hidden", padding: 28, background: `linear-gradient(135deg, ${tone.bg} 0%, rgb(var(--c-surface)) 55%)` }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: "1 1 340px", minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 52, height: 52, borderRadius: 16, flexShrink: 0, background: tone.bg, color: tone.fg, display: "grid", placeItems: "center" }}>
                <Icon size={24} />
              </span>
              <div>
                <p className="text-sm font-medium text-muted">{selected === TODAY_INDEX ? `Today · ${day.day}` : day.day}</p>
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink leading-tight">{isRest ? "Rest day" : day.focus}</h2>
              </div>
            </div>

            {!isRest && <p className="inline-flex items-center gap-1.5 text-sm text-muted mt-3"><Clock size={15} /> {day.durationMinutes} minutes</p>}
            {isRest && <p className="text-sm text-muted mt-3">Recovery is when your body gets stronger. {day.activities[0]}.</p>}

            {!isRest && (
              <ul style={{ listStyle: "none", padding: 0, margin: "18px 0 20px", display: "grid", gap: 8 }}>
                {day.activities.map((a, i) => (
                  <li key={i} className="text-sm text-ink bg-canvas" style={{ display: "flex", gap: 10, alignItems: "flex-start", borderRadius: 12, padding: "10px 14px" }}>
                    <Check size={16} strokeWidth={3} style={{ marginTop: 2, flexShrink: 0, color: isDone ? "#17AB83" : "rgb(var(--c-muted))" }} /> {a}
                  </li>
                ))}
              </ul>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", marginTop: isRest ? 18 : 0 }}>
              {!isRest && (
                <Button type="button" variant={isDone ? "outline" : "primary"} onClick={() => toggleDone(day.day)}>
                  {isDone ? "✓ Completed · undo" : "Mark as done"}
                </Button>
              )}
              {next && next.day !== day.day && (
                <button type="button" onClick={() => setSelected(days.indexOf(next))} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:underline">
                  {isRest ? "Next workout" : "Next up"}: {next.day} · {next.focus} <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
          <Ring value={doneWorkouts.length} total={workouts.length} />
        </div>
      </div>

      {/* Week strip */}
      <div className="scroll-thin" style={{ overflowX: "auto", paddingBottom: 4 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(92px, 1fr))", gap: 10 }}>
          {days.map((d, i) => {
            const t = toneOf(d), Icon = t.icon, sel = i === selected, finished = done.includes(d.day);
            return (
              <button key={d.day} type="button" onClick={() => setSelected(i)} aria-pressed={sel}
                className={`rounded-2xl border text-center transition-all focus-ring ${sel ? "bg-brand-50 border-brand-400" : "bg-surface border-line/[0.06] hover:border-brand-300"}`}
                style={{ padding: "12px 8px" }}>
                <p className={`text-xs font-semibold ${i === TODAY_INDEX ? "text-brand-500" : "text-ink"}`}>
                  {d.day.slice(0, 3)}{i === TODAY_INDEX && <span title="Today" style={{ display: "inline-block", width: 6, height: 6, borderRadius: 999, background: "rgb(var(--c-brand-500))", marginLeft: 5, verticalAlign: "middle" }} />}
                </p>
                <div style={{ position: "relative", width: 40, height: 40, margin: "10px auto 8px", borderRadius: 14, background: t.bg, color: t.fg, display: "grid", placeItems: "center" }}>
                  <Icon size={19} />
                  {finished && <span style={{ position: "absolute", top: -5, right: -5, width: 16, height: 16, borderRadius: 999, background: "#17AB83", color: "#fff", display: "grid", placeItems: "center" }}><Check size={10} strokeWidth={4} /></span>}
                </div>
                <p className="text-[11px] text-ink font-medium truncate" style={{ minHeight: 16 }}>{d.durationMinutes ? d.focus.split(/ [—(&+]/)[0] : "Rest"}</p>
                <p className="text-[11px] text-muted font-mono mt-0.5">{d.durationMinutes ? `${d.durationMinutes} min` : "—"}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats + tips */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <Card title="This week" eyebrow="Progress">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {[[CalendarDays, `${doneWorkouts.length}/${workouts.length}`, "workouts done"], [Clock, `${doneMinutes}/${totalMinutes}`, "minutes done"], [Moon, days.length - workouts.length, "rest days"]].map(([I, v, l]) => (
              <div key={l} className="bg-canvas rounded-xl text-center" style={{ padding: "16px 8px" }}>
                <I size={16} className="mx-auto mb-1.5 text-brand-500" />
                <p className="font-mono text-lg font-bold text-ink leading-none">{v}</p>
                <p className="text-[11px] text-muted mt-1.5">{l}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Training tips" icon={Lightbulb}>
          <ul className="space-y-2">
            {plan.notes.map((n, i) => <li key={i} className="text-sm text-muted flex gap-2"><span className="text-mint-500">•</span>{n}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
}
