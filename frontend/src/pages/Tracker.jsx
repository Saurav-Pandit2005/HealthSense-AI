import { useCallback, useEffect, useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ClipboardList, HeartPulse, Activity, RefreshCw, Footprints, Moon, Droplets, RotateCcw, Check, Flame } from "lucide-react";
import { trackerApi } from "../api/client";
import { useChartColors } from "../context/ThemeContext";
import { Card } from "../components/ui/Card";
import { Field, TextInput, Button, ChipToggle } from "../components/ui/Field";
import { ErrorState, LoadingState, EmptyState } from "../components/ui/States";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const VITAL_FIELDS = [
  { key: "weight_kg", label: "Weight", unit: "kg", min: 2, max: 400, step: 0.1 },
  { key: "bp_systolic", label: "BP Systolic", unit: "mmHg", min: 60, max: 260, step: 1, hint: "The top number, e.g. 120" },
  { key: "bp_diastolic", label: "BP Diastolic", unit: "mmHg", min: 30, max: 160, step: 1, hint: "The bottom number, e.g. 80" },
  { key: "bloodSugar", label: "Blood Sugar", unit: "mg/dL", min: 20, max: 600, step: 1 },
  { key: "heartRate", label: "Heart Rate", unit: "bpm", min: 25, max: 250, step: 1, hint: "Resting rate is typically 60–100" },
];

const LIFESTYLE_FIELDS = [
  { key: "sleepHours", label: "Sleep", unit: "hrs", min: 0, max: 16, step: 0.5 },
  {
    key: "waterIntakeL", label: "Water Intake", unit: "L", min: 0, max: 10, step: 0.1,
    quick: [{ label: "+250 ml", delta: 0.25 }, { label: "+500 ml", delta: 0.5 }],
  },
  {
    key: "steps", label: "Steps", unit: "", min: 0, max: 60000, step: 100,
    quick: [{ label: "+1,000", delta: 1000 }, { label: "+5,000", delta: 5000 }],
  },
  { key: "exerciseMinutes", label: "Exercise", unit: "min", min: 0, max: 600, step: 5 },
  { key: "calories", label: "Calories", unit: "kcal", min: 0, max: 10000, step: 10 },
];

const ALL_FIELDS = [...VITAL_FIELDS, ...LIFESTYLE_FIELDS];
const emptyForm = Object.fromEntries(ALL_FIELDS.map((f) => [f.key, ""]));

// Same daily targets the Dashboard uses
const TARGETS = { steps: 10000, sleep: 8, water: 2.5 };

const HISTORY_DAYS = 30;

const TREND_METRICS = [
  { key: "weight_kg", label: "Weight", unit: "kg" },
  { key: "steps", label: "Steps", unit: "" },
  { key: "sleepHours", label: "Sleep", unit: "hrs" },
  { key: "waterIntakeL", label: "Water", unit: "L" },
  { key: "heartRate", label: "Heart rate", unit: "bpm" },
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "bloodSugar", label: "Blood sugar", unit: "mg/dL" },
];

const fmtNum = (v) => (typeof v === "number" ? v.toLocaleString() : v);

const LOG_COLUMNS = [
  { label: "Steps", get: (h) => (h.steps != null ? fmtNum(h.steps) : null) },
  { label: "Weight", get: (h) => (h.weight_kg != null ? `${h.weight_kg} kg` : null) },
  { label: "BP", get: (h) => (h.bp_systolic != null || h.bp_diastolic != null ? `${h.bp_systolic ?? "–"}/${h.bp_diastolic ?? "–"}` : null) },
  { label: "Sugar", get: (h) => (h.bloodSugar != null ? `${h.bloodSugar}` : null) },
  { label: "Heart rate", get: (h) => (h.heartRate != null ? `${h.heartRate} bpm` : null) },
  { label: "Sleep", get: (h) => (h.sleepHours != null ? `${h.sleepHours} h` : null) },
  { label: "Water", get: (h) => (h.waterIntakeL != null ? `${h.waterIntakeL} L` : null) },
  { label: "Calories", get: (h) => (h.calories != null ? fmtNum(h.calories) : null) },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, "0");
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
// Parse "YYYY-MM-DD" as a *local* date (new Date("YYYY-MM-DD") is UTC and can shift the day)
const parseKey = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtDate = (s, opts) => parseKey(s).toLocaleDateString(undefined, opts);
const num = (v) => (v === "" || v === null || v === undefined ? null : Number(v));
const round = (v, dp = 2) => +v.toFixed(dp);

function validate(form) {
  const errors = {};
  for (const f of ALL_FIELDS) {
    const raw = form[f.key];
    if (raw === "") continue;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < f.min || n > f.max) {
      errors[f.key] = `Enter a value between ${f.min.toLocaleString()} and ${f.max.toLocaleString()}`;
    }
  }
  if (!errors.bp_systolic && !errors.bp_diastolic && form.bp_systolic !== "" && form.bp_diastolic !== "") {
    if (Number(form.bp_systolic) <= Number(form.bp_diastolic)) {
      errors.bp_systolic = "Systolic should be higher than diastolic";
    }
  }
  return errors;
}

// Consecutive logged days ending today (or yesterday, so the streak isn't "lost" before you log today)
function computeStreak(logs) {
  const days = new Set(logs.map((l) => String(l.date).slice(0, 10)));
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(toKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let n = 0;
  while (days.has(toKey(cursor))) {
    n += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return n;
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

const TONES = {
  neutral: { icon: "bg-brand-50 text-brand-600 ring-brand-100", bar: "bg-brand-400" },
  coral: { icon: "bg-coral-50 text-coral-500 ring-coral-100", bar: "bg-coral-400" },
  amber: { icon: "bg-amber-50 text-amber-500 ring-amber-100", bar: "bg-amber-400" },
  mint: { icon: "bg-mint-50 text-mint-600 ring-mint-100", bar: "bg-mint-400" },
};

function ProgressTile({ icon: Icon, label, value, target, unit }) {
  const hasValue = value !== null && !Number.isNaN(value);
  const pct = hasValue ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const tone = !hasValue ? "neutral" : pct < 40 ? "coral" : pct < 70 ? "amber" : "mint";
  const t = TONES[tone];
  return (
    <div className="rounded-xl border border-line/[0.06] p-4">
      <div className="flex items-center gap-2.5">
        <span className={`w-8 h-8 rounded-lg ring-1 grid place-items-center shrink-0 ${t.icon}`}>
          <Icon size={16} strokeWidth={2.2} />
        </span>
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className="ml-auto font-mono text-xs text-muted">{hasValue ? `${pct}%` : "—"}</span>
      </div>
      <p className="font-mono text-xl font-bold text-ink mt-3 leading-none">
        {hasValue ? fmtNum(value) : "—"}
        <span className="text-xs font-normal text-muted ml-1.5">
          / {fmtNum(target)} {unit}
        </span>
      </p>
      <div className="h-1.5 rounded-full bg-line/[0.06] overflow-hidden mt-3" role="progressbar" aria-label={`${label} progress`} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full rounded-full transition-all duration-300 ${t.bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NumberField({ field, value, error, onChange, onBlur, onQuickAdd }) {
  return (
    <Field label={field.label} htmlFor={field.key} error={error} hint={field.hint}>
      <div className="relative">
        <TextInput
          id={field.key}
          type="number"
          inputMode="decimal"
          step={field.step}
          min={field.min}
          max={field.max}
          placeholder="—"
          value={value}
          error={!!error}
          aria-invalid={!!error}
          onChange={(e) => onChange(field.key, e.target.value)}
          onBlur={() => onBlur(field.key)}
          onWheel={(e) => e.currentTarget.blur()} // scrolling the page shouldn't change the number
          className={field.unit ? "pr-16" : ""}
        />
        {field.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted pointer-events-none">{field.unit}</span>}
      </div>
      {field.quick && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {field.quick.map((q) => (
            <ChipToggle key={q.label} onClick={() => onQuickAdd(field, q.delta)}>
              {q.label}
            </ChipToggle>
          ))}
        </div>
      )}
    </Field>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Tracker() {
  const chart = useChartColors();

  const [form, setForm] = useState(emptyForm);
  const [baseline, setBaseline] = useState(emptyForm); // what's currently saved on the server
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const [initializing, setInitializing] = useState(true);
  const [todayError, setTodayError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const [history, setHistory] = useState([]); // oldest → newest
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [metric, setMetric] = useState("weight_kg");

  const todayKey = toKey(new Date());

  /* ---------- data loading ---------- */

  const loadToday = useCallback(() => {
    setInitializing(true);
    setTodayError(null);
    trackerApi
      .today()
      .then((data) => {
        if (data.log) {
          const filled = {};
          for (const key of Object.keys(emptyForm)) {
            filled[key] = data.log[key] !== undefined && data.log[key] !== null ? String(data.log[key]) : "";
          }
          setForm(filled);
          setBaseline(filled);
        }
      })
      .catch((err) => {
        // "no log yet" style 4xx responses are fine — only surface real failures
        if (!err.status || err.status >= 500) setTodayError(err.message);
      })
      .finally(() => setInitializing(false));
  }, []);

  const loadHistory = useCallback(() => {
    setHistoryLoading(true);
    setHistoryError(null);
    trackerApi
      .history(HISTORY_DAYS)
      .then((data) => setHistory(data.logs || []))
      .catch((err) => setHistoryError(err.message))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    loadToday();
    loadHistory();
  }, [loadToday, loadHistory]);

  /* ---------- derived state ---------- */

  const errors = useMemo(() => validate(form), [form]);
  const dirty = useMemo(() => ALL_FIELDS.some((f) => form[f.key] !== baseline[f.key]), [form, baseline]);
  const filledCount = ALL_FIELDS.filter((f) => form[f.key] !== "").length;
  const visibleError = (key) => (submitted || touched[key] ? errors[key] : undefined);

  const streak = useMemo(() => computeStreak(history), [history]);
  const recent = useMemo(() => [...history].reverse().slice(0, 7), [history]); // newest first

  const series = useMemo(
    () =>
      history
        .filter((h) => h[metric] !== null && h[metric] !== undefined)
        .map((h) => ({ date: fmtDate(h.date, { day: "numeric", month: "short" }), value: h[metric], key: String(h.date).slice(0, 10) })),
    [history, metric]
  );

  const metricMeta = TREND_METRICS.find((m) => m.key === metric);
  const metricColor = { weight_kg: chart.weight, steps: chart.steps, sleepHours: chart.fat, waterIntakeL: chart.weight, calories: chart.fat }[metric] || "#F27A5C";

  const trendStats = useMemo(() => {
    if (series.length === 0) return null;
    const weekAgo = new Date();
    weekAgo.setHours(0, 0, 0, 0);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const week = series.filter((s) => parseKey(s.key) >= weekAgo);
    const avg = week.length ? round(week.reduce((a, s) => a + s.value, 0) / week.length, 1) : null;
    const latest = series[series.length - 1].value;
    const change = series.length >= 2 ? round(latest - series[0].value, 1) : null;
    return { avg, latest, change, days: series.length };
  }, [series]);

  /* ---------- handlers ---------- */

  // Warn before leaving the page with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Hide the "Saved" tick after a few seconds (and clean up on unmount)
  useEffect(() => {
    if (!saved) return undefined;
    const t = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(t);
  }, [saved]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function markTouched(key) {
    setTouched((prev) => (prev[key] ? prev : { ...prev, [key]: true }));
  }

  function quickAdd(field, delta) {
    const current = Number(form[field.key]) || 0;
    const next = Math.min(field.max, round(current + delta));
    updateField(field.key, String(next));
  }

  function handleReset() {
    setForm(baseline);
    setTouched({});
    setSubmitted(false);
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitted(true);

    if (filledCount === 0) {
      setError("Enter at least one value before saving.");
      return;
    }
    const firstInvalid = ALL_FIELDS.find((f) => errors[f.key]);
    if (firstInvalid) {
      document.getElementById(firstInvalid.key)?.focus();
      return;
    }

    setSaving(true);
    try {
      const payload = {};
      for (const [key, value] of Object.entries(form)) {
        if (value !== "") payload[key] = Number(value);
      }
      await trackerApi.upsert(payload);
      setBaseline(form);
      setTouched({});
      setSubmitted(false);
      setSaved(true);
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  /* ---------- render ---------- */

  if (initializing) {
    return (
      <div className="py-16">
        <LoadingState label="Loading today's log…" />
      </div>
    );
  }

  const fieldProps = (f) => ({
    field: f,
    value: form[f.key],
    error: visibleError(f.key),
    onChange: updateField,
    onBlur: markTouched,
    onQuickAdd: quickAdd,
  });

  return (
    <div className="space-y-6 animate-fadeUp">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <ClipboardList size={22} className="text-brand-500" /> Health Tracker
          </h1>
          <p className="text-sm text-muted">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-500 border border-amber-100 text-xs font-semibold px-3 py-1.5">
            <Flame size={14} strokeWidth={2.4} />
            {streak}-day streak{streak >= HISTORY_DAYS ? "+" : ""}
          </span>
        )}
      </div>

      {todayError && (
        <div className="space-y-2">
          <ErrorState message={`Couldn't load today's saved log. ${todayError}`} />
          <Button type="button" variant="outline" onClick={loadToday}>
            <RefreshCw size={14} /> Try again
          </Button>
        </div>
      )}

      {/* Live progress */}
      <Card title="Today's progress" eyebrow="Live preview">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ProgressTile icon={Footprints} label="Steps" value={num(form.steps)} target={TARGETS.steps} unit="steps" />
          <ProgressTile icon={Moon} label="Sleep" value={num(form.sleepHours)} target={TARGETS.sleep} unit="hrs" />
          <ProgressTile icon={Droplets} label="Water" value={num(form.waterIntakeL)} target={TARGETS.water} unit="L" />
        </div>
      </Card>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Card title="Vitals" eyebrow="Today" icon={HeartPulse}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4">
            {VITAL_FIELDS.map((f) => (
              <NumberField key={f.key} {...fieldProps(f)} />
            ))}
          </div>
        </Card>

        <Card title="Lifestyle" eyebrow="Today" icon={Activity}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4">
            {LIFESTYLE_FIELDS.map((f) => (
              <NumberField key={f.key} {...fieldProps(f)} />
            ))}
          </div>
        </Card>

        {error && <ErrorState message={error} />}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" loading={saving} disabled={saving || !dirty} className="flex-1 sm:flex-none">
            Save Today's Log
          </Button>
          {dirty && (
            <Button type="button" variant="ghost" onClick={handleReset} disabled={saving}>
              <RotateCcw size={14} /> Reset
            </Button>
          )}
          <span className="text-sm font-medium" role="status" aria-live="polite">
            {saved ? (
              <span className="inline-flex items-center gap-1 text-mint-600">
                <Check size={15} strokeWidth={2.6} /> Saved
              </span>
            ) : dirty ? (
              <span className="text-amber-500">Unsaved changes</span>
            ) : null}
          </span>
        </div>
      </form>

      {/* Recent logs */}
      {!historyLoading && !historyError && recent.length > 0 && (
        <Card title="Recent logs" eyebrow="History">
          {/* Desktop / tablet: table */}
          <div className="hidden sm:block overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-line/[0.06]">
                  <th scope="col" className="py-2 pr-4 font-medium sticky left-0 bg-surface">Date</th>
                  {LOG_COLUMNS.map((c) => (
                    <th key={c.label} scope="col" className="py-2 pr-4 font-medium whitespace-nowrap">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((h) => {
                  const isToday = String(h.date).slice(0, 10) === todayKey;
                  return (
                    <tr key={h._id || h.date} className={`border-b border-line/[0.04] last:border-0 ${isToday ? "bg-brand-50/60" : ""}`}>
                      <td className="py-2 pr-4 whitespace-nowrap text-ink font-medium sticky left-0 bg-surface">
                        {isToday ? "Today" : fmtDate(h.date, { weekday: "short", day: "numeric", month: "short" })}
                      </td>
                      {LOG_COLUMNS.map((c) => (
                        <td key={c.label} className="py-2 pr-4 font-mono text-xs text-ink whitespace-nowrap">{c.get(h) ?? "—"}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile: one compact card per day, only showing what was logged */}
          <ul className="sm:hidden space-y-3">
            {recent.map((h) => {
              const isToday = String(h.date).slice(0, 10) === todayKey;
              const items = LOG_COLUMNS.map((c) => ({ label: c.label, value: c.get(h) })).filter((i) => i.value !== null);
              return (
                <li key={h._id || h.date} className={`rounded-xl border border-line/[0.06] p-3 ${isToday ? "bg-brand-50/60" : ""}`}>
                  <p className="text-sm font-semibold text-ink mb-2">
                    {isToday ? "Today" : fmtDate(h.date, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted">Nothing logged.</p>
                  ) : (
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {items.map((i) => (
                        <div key={i.label} className="flex items-baseline justify-between gap-2">
                          <dt className="text-xs text-muted">{i.label}</dt>
                          <dd className="font-mono text-xs text-ink">{i.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}