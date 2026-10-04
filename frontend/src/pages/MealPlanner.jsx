import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sunrise, Sun, Apple, Moon, Lightbulb, Target, Flame, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { mealApi } from "../api/client";
import { Card } from "../components/ui/Card";
import { ChipToggle, Button } from "../components/ui/Field";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { useChartColors } from "../context/ThemeContext";

const PREFERENCES = [
  { value: "vegetarian", label: "Vegetarian" },
  { value: "vegan", label: "Vegan" },
  { value: "eggetarian", label: "Eggetarian" },
  { value: "non_vegetarian", label: "Non-Vegetarian" },
];
const GOAL_LABELS = { lose_weight: "Lose Weight", gain_muscle: "Gain Muscle", maintain: "Maintain Weight", general_fitness: "General Fitness" };

const MEAL_META = {
  breakfast: { label: "Breakfast", icon: Sunrise, bg: "bg-amber-50", border: "border-amber-100" },
  lunch: { label: "Lunch", icon: Sun, bg: "bg-mint-50", border: "border-mint-100" },
  snack: { label: "Snack", icon: Apple, bg: "bg-brand-50", border: "border-brand-100" },
  dinner: { label: "Dinner", icon: Moon, bg: "bg-coral-50", border: "border-coral-100" },
};

// How the calorie target was set from your maintenance calories (same numbers the backend uses)
const GOAL_ADJ = { lose_weight: -500, gain_muscle: 300, maintain: 0, general_fitness: -100 };
// Suggested split of the day's calories across meals
const MEAL_SPLIT = [
  { key: "breakfast", label: "Breakfast", icon: Sunrise, share: 0.25, color: "#E8A63C" },
  { key: "lunch", label: "Lunch", icon: Sun, share: 0.35, color: "#22C99B" },
  { key: "snack", label: "Snack", icon: Apple, share: 0.1, color: "#3D9797" },
  { key: "dinner", label: "Dinner", icon: Moon, share: 0.3, color: "#F0603D" },
];
const round5 = (n) => Math.round(n / 5) * 5;

export default function MealPlanner() {
  const chart = useChartColors();
  const COLORS = { protein: chart.protein, carbs: chart.carbs, fat: chart.fat };
  const [preference, setPreference] = useState("vegetarian");
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  function load(pref) {
    setLoading(true);
    setError(null);
    setNeedsProfile(false);
    mealApi
      .plan(pref)
      .then((d) => setPlan(d.plan))
      .catch((err) => (err.status === 400 ? setNeedsProfile(true) : setError(err.message)))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(preference), []); // eslint-disable-line react-hooks/exhaustive-deps

  function changePreference(pref) {
    setPreference(pref);
    load(pref);
  }

  if (needsProfile) {
    return (
      <Card>
        <EmptyState
          label="Complete your profile (age, gender, height, weight) to get a personalized meal plan."
          action={
            <Link to="/profile-setup">
              <Button variant="secondary">Complete Profile</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const kcal = plan?.dailyCalories || 0;
  const macros = plan
    ? [
        { name: "protein", label: "Protein", pct: plan.macroSplit.protein, grams: Math.round((kcal * plan.macroSplit.protein) / 100 / 4), kcal: Math.round((kcal * plan.macroSplit.protein) / 100) },
        { name: "carbs", label: "Carbs", pct: plan.macroSplit.carbs, grams: Math.round((kcal * plan.macroSplit.carbs) / 100 / 4), kcal: Math.round((kcal * plan.macroSplit.carbs) / 100) },
        { name: "fat", label: "Fat", pct: plan.macroSplit.fat, grams: Math.round((kcal * plan.macroSplit.fat) / 100 / 9), kcal: Math.round((kcal * plan.macroSplit.fat) / 100) },
      ]
    : [];
  const adj = plan ? GOAL_ADJ[plan.goal] : undefined;

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight">Meal plan</h1>
          <p className="text-sm text-muted mt-1">Daily meal ideas based on your profile and goal.</p>
        </div>
        {plan?.goal && (
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-2 rounded-full">
            <Target size={13} /> {GOAL_LABELS[plan.goal] || plan.goal}
          </span>
        )}
      </div>

      {/* Dietary preference */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted mr-1">I eat:</span>
        {PREFERENCES.map((p) => (
          <ChipToggle key={p.value} selected={preference === p.value} onClick={() => changePreference(p.value)}>
            {p.label}
          </ChipToggle>
        ))}
      </div>

      {!plan && loading && (
        <div className="py-16">
          <LoadingState label="Building your meal plan…" />
        </div>
      )}
      {!loading && error && <ErrorState message={error} />}

      {plan && (
        <div className="space-y-6" style={{ opacity: loading ? 0.5 : 1, transition: "opacity .2s" }}>
          {/* Calories + macros */}
          <Card>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 32, alignItems: "stretch" }}>
              <div style={{ flex: "0 1 230px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted mb-2">
                  <Flame size={14} className="text-coral-500" /> Daily calorie target
                </p>
                <p className="font-mono text-5xl font-bold text-ink leading-none">{kcal.toLocaleString()}</p>
                <p className="text-sm text-muted mt-1.5">kcal per day</p>
                {adj !== undefined && (
                  <p className="inline-flex items-start gap-1.5 text-xs text-muted mt-4 bg-canvas rounded-lg" style={{ padding: "8px 10px" }}>
                    {adj < 0 ? <TrendingDown size={14} className="text-brand-500 shrink-0 mt-px" /> : adj > 0 ? <TrendingUp size={14} className="text-brand-500 shrink-0 mt-px" /> : <Minus size={14} className="text-brand-500 shrink-0 mt-px" />}
                    <span>
                      {adj === 0 ? "Equal to your maintenance" : `${Math.abs(adj)} kcal ${adj < 0 ? "below" : "above"} your maintenance`}
                      <span className="text-muted"> (about {(kcal - adj).toLocaleString()} kcal)</span>
                    </span>
                  </p>
                )}
              </div>

              <div style={{ flex: "1 1 340px", minWidth: 0 }}>
                <p className="text-xs font-semibold text-muted mb-3">Macros per day</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                  {macros.map((m) => (
                    <div key={m.name} className="bg-canvas rounded-xl" style={{ padding: "12px 14px" }}>
                      <p className="flex items-center gap-1.5 text-xs text-muted">
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: COLORS[m.name] }} /> {m.label}
                      </p>
                      <p className="font-mono text-2xl font-bold text-ink mt-1 leading-none">
                        {m.grams}
                        <span className="text-xs font-normal text-muted ml-1">g</span>
                      </p>
                      <p className="text-[11px] text-muted mt-1.5">
                        {m.pct}% · <span className="font-mono">{m.kcal}</span> kcal
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-line/[0.06]" style={{ marginTop: 20, paddingTop: 16 }}>
              <p className="text-xs font-semibold text-muted mb-2.5">Calories by meal <span className="font-normal">(suggested split)</span></p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
                {MEAL_SPLIT.map(({ key, label, icon: Icon, share, color }) => (
                  <div key={key} className="bg-canvas" style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12 }}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: "grid", placeItems: "center", background: `${color}26`, color }}>
                      <Icon size={16} />
                    </span>
                    <div>
                      <p className="text-[11px] text-muted leading-tight">{label} · {Math.round(share * 100)}%</p>
                      <p className="font-mono text-sm font-bold text-ink leading-tight mt-0.5">{round5(kcal * share)} <span className="text-[10px] font-normal text-muted">kcal</span></p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted mt-4">{plan.assumptions}</p>
            </div>
          </Card>

          {/* Today's Meal Ideas */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-3">Today's Meal Ideas</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(plan.meals).map(([mealType, options]) => {
                const meta = MEAL_META[mealType] || MEAL_META.snack;
                const Icon = meta.icon;
                const isFallback = options.length === 1 && options[0].startsWith("Consult a dietitian");
                return (
                  <div key={mealType} className={`rounded-xl border p-4 ${isFallback ? "bg-amber-50 border-amber-100" : `${meta.bg} ${meta.border}`}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink">
                        <Icon size={14} /> {meta.label}
                      </span>
                      {!isFallback && <span className="text-[11px] text-muted">{options.length} options</span>}
                    </div>
                    {isFallback ? (
                      <p className="text-sm text-amber-600">{options[0]}</p>
                    ) : (
                      <ul className="text-sm text-ink space-y-1.5">
                        {options.map((o) => (
                          <li key={o} className="flex gap-1.5">
                            <span className="text-muted">•</span>
                            {o}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Nutrition Tips */}
          <Card title="Nutrition Tips" icon={Lightbulb}>
            <ul className="space-y-1.5">
              {plan.tips.map((t, i) => (
                <li key={i} className="text-sm text-muted flex gap-2">
                  <span className="text-mint-500 mt-0.5">•</span>
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}
