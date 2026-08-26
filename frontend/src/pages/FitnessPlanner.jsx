import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, Lightbulb, RefreshCw, Clock, CalendarDays, Moon } from "lucide-react";
import { fitnessApi } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Field";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";

const GOAL_LABELS = {
  lose_weight: "Lose Weight",
  gain_muscle: "Gain Muscle",
  maintain: "Maintain Weight",
  general_fitness: "General Fitness",
};

const FOCUS_COLORS = {
  Cardio: { bg: "bg-brand-50", text: "text-brand-600", dot: "bg-brand-400" },
  Rest: { bg: "bg-black/[0.03]", text: "text-muted", dot: "bg-muted" },
  HIIT: { bg: "bg-coral-50", text: "text-coral-500", dot: "bg-coral-400" },
  "Low-Impact Cardio": { bg: "bg-brand-50", text: "text-brand-600", dot: "bg-brand-400" },
};
function focusStyle(focus) {
  if (FOCUS_COLORS[focus]) return FOCUS_COLORS[focus];
  if (focus.includes("Strength") || focus.includes("Push") || focus.includes("Pull") || focus.includes("Legs")) {
    return { bg: "bg-amber-50", text: "text-amber-500", dot: "bg-amber-400" };
  }
  if (focus.includes("Flexibility") || focus.includes("Recovery")) {
    return { bg: "bg-mint-50", text: "text-mint-600", dot: "bg-mint-400" };
  }
  return { bg: "bg-brand-50", text: "text-brand-600", dot: "bg-brand-400" };
}

const TODAY_INDEX = (new Date().getDay() + 6) % 7; // Monday = 0

export default function FitnessPlanner() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    setNeedsProfile(false);
    fitnessApi
      .plan()
      .then((data) => setPlan(data.plan))
      .catch((err) => {
        if (err.status === 400) setNeedsProfile(true);
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingState label="Building your fitness plan…" />
      </div>
    );
  }

  if (needsProfile) {
    return (
      <Card>
        <EmptyState
          label="Set your fitness goal in your profile to get a personalized weekly plan."
          action={
            <Link to="/profile-setup">
              <Button variant="secondary">Complete Profile</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (error) return <ErrorState message={error} />;

  const workoutDays = plan.weeklyPlan.filter((d) => d.durationMinutes > 0).length;
  const totalMinutes = plan.weeklyPlan.reduce((sum, d) => sum + d.durationMinutes, 0);
  const restDays = plan.weeklyPlan.length - workoutDays;

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <Dumbbell size={22} className="text-brand-500" /> Fitness Planner
          </h1>
          <p className="text-sm text-muted">Your personalized weekly workout plan</p>
        </div>
        <Button variant="outline" onClick={load}>
          <RefreshCw size={14} /> Regenerate
        </Button>
      </div>

      <Card>
        <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1">Current Goal</p>
        <p className="font-display text-xl font-bold text-brand-600 mb-4">{GOAL_LABELS[plan.goal] || plan.goal}</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-canvas rounded-xl p-4 text-center">
            <CalendarDays size={18} className="mx-auto mb-1 text-brand-500" />
            <p className="font-mono text-2xl font-bold text-ink">{workoutDays}</p>
            <p className="text-[11px] text-muted">workout days/week</p>
          </div>
          <div className="bg-canvas rounded-xl p-4 text-center">
            <Clock size={18} className="mx-auto mb-1 text-brand-500" />
            <p className="font-mono text-2xl font-bold text-ink">{totalMinutes}</p>
            <p className="text-[11px] text-muted">min/week</p>
          </div>
          <div className="bg-canvas rounded-xl p-4 text-center">
            <Moon size={18} className="mx-auto mb-1 text-brand-500" />
            <p className="font-mono text-2xl font-bold text-ink">{restDays}</p>
            <p className="text-[11px] text-muted">rest days/week</p>
          </div>
        </div>
      </Card>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">This Week's Schedule</p>
        <div className="flex gap-3 overflow-x-auto scroll-thin pb-2">
          {plan.weeklyPlan.map((day, i) => {
            const style = focusStyle(day.focus);
            const isToday = i === TODAY_INDEX;
            return (
              <div
                key={day.day}
                className={`shrink-0 w-56 rounded-xl border p-4 ${isToday ? "border-brand-400 ring-2 ring-brand-100" : "border-black/[0.06]"} bg-surface`}
              >
                {isToday && <span className="inline-block text-[10px] font-bold text-brand-500 uppercase tracking-wide mb-1">Today</span>}
                <p className="text-[11px] text-muted uppercase tracking-wide">{day.day.slice(0, 3)}</p>
                <p className="font-semibold text-ink mb-2">{day.day}</p>
                <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full mb-3 ${style.bg} ${style.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} /> {day.focus}
                </span>
                <ul className="text-xs text-muted space-y-1 mb-3">
                  {day.activities.map((a, j) => (
                    <li key={j}>• {a}</li>
                  ))}
                </ul>
                <p className="text-xs text-muted flex items-center gap-1">
                  <Clock size={11} /> {day.durationMinutes} min
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <Card title="Training Tips" icon={Lightbulb}>
        <ul className="space-y-1.5">
          {plan.notes.map((n, i) => (
            <li key={i} className="text-sm text-muted flex gap-2">
              <span className="text-mint-500 mt-0.5">•</span>
              {n}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
