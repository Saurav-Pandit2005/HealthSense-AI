import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Salad, Sunrise, Sun, Apple, Moon, Lightbulb } from "lucide-react";
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

const MEAL_META = {
  breakfast: { label: "Breakfast", icon: Sunrise, bg: "bg-amber-50", border: "border-amber-100" },
  lunch: { label: "Lunch", icon: Sun, bg: "bg-mint-50", border: "border-mint-100" },
  snack: { label: "Snack", icon: Apple, bg: "bg-brand-50", border: "border-brand-100" },
  dinner: { label: "Dinner", icon: Moon, bg: "bg-coral-50", border: "border-coral-100" },
};

export default function MealPlanner() {
  const chart = useChartColors();
  const MACRO_COLORS = { protein: chart.protein, carbs: chart.carbs, fat: chart.fat };
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
      .then((data) => setPlan(data.plan))
      .catch((err) => {
        if (err.status === 400) setNeedsProfile(true);
        else setError(err.message);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => load(preference), []); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePreferenceChange(pref) {
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

  const macroData = plan ? Object.entries(plan.macroSplit).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
          <Salad size={22} className="text-brand-500" /> Meal Planner
        </h1>
        <p className="text-sm text-muted">Personalized daily meal suggestions based on your profile & goal</p>
      </div>

      <Card>
        <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-2">Dietary Preference</p>
        <div className="flex flex-wrap gap-2">
          {PREFERENCES.map((p) => (
            <ChipToggle key={p.value} selected={preference === p.value} onClick={() => handlePreferenceChange(p.value)}>
              {p.label}
            </ChipToggle>
          ))}
        </div>
      </Card>

      {loading && (
        <div className="py-16">
          <LoadingState label="Building your meal plan…" />
        </div>
      )}
      {!loading && error && <ErrorState message={error} />}

      {!loading && plan && (
        <>
          <Card>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-32 h-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macroData} dataKey="value" innerRadius={38} outerRadius={60} paddingAngle={2} stroke="none">
                      {macroData.map((m) => (
                        <Cell key={m.name} fill={MACRO_COLORS[m.name]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v, n) => [`${v}%`, n]}
                      contentStyle={{ background: chart.tooltipBg, border: `1px solid ${chart.tooltipBorder}`, borderRadius: 8, color: chart.tooltipText }}
                      itemStyle={{ color: chart.tooltipText }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 w-full">
                <p className="text-[11px] uppercase tracking-wide text-muted font-medium mb-1">Daily Calorie Target</p>
                <p className="font-mono text-4xl font-bold text-brand-600 mb-1">
                  {plan.dailyCalories} <span className="text-base font-normal text-muted">kcal</span>
                </p>
                <p className="text-xs text-muted mb-4">{plan.assumptions}</p>
                <div className="space-y-1.5">
                  {macroData.map((m) => (
                    <div key={m.name} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: MACRO_COLORS[m.name] }} />
                      <span className="capitalize text-muted w-16">{m.name}</span>
                      <span className="font-mono font-semibold text-ink">{m.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

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
        </>
      )}
    </div>
  );
}
