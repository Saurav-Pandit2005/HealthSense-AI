import { useEffect, useState } from "react";
import { ClipboardList, HeartPulse, Activity, RefreshCw } from "lucide-react";
import { trackerApi } from "../api/client";
import { Card } from "../components/ui/Card";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState, LoadingState, EmptyState } from "../components/ui/States";

const VITAL_FIELDS = [
  { key: "weight_kg", label: "Weight", unit: "kg", min: 2, max: 400, step: 0.1 },
  { key: "bp_systolic", label: "BP Systolic", unit: "mmHg", min: 60, max: 260, step: 1 },
  { key: "bp_diastolic", label: "BP Diastolic", unit: "mmHg", min: 30, max: 160, step: 1 },
  { key: "bloodSugar", label: "Blood Sugar", unit: "mg/dL", min: 20, max: 600, step: 1 },
  { key: "heartRate", label: "Heart Rate", unit: "bpm", min: 25, max: 250, step: 1 },
];

const LIFESTYLE_FIELDS = [
  { key: "sleepHours", label: "Sleep", unit: "hrs", min: 0, max: 16, step: 0.5 },
  { key: "waterIntakeL", label: "Water Intake", unit: "L", min: 0, max: 10, step: 0.1 },
  { key: "steps", label: "Steps", unit: "", min: 0, max: 60000, step: 100 },
  { key: "exerciseMinutes", label: "Exercise", unit: "min", min: 0, max: 600, step: 5 },
  { key: "calories", label: "Calories", unit: "kcal", min: 0, max: 10000, step: 10 },
];

const emptyForm = Object.fromEntries([...VITAL_FIELDS, ...LIFESTYLE_FIELDS].map((f) => [f.key, ""]));

export default function Tracker() {
  const [form, setForm] = useState(emptyForm);
  const [initializing, setInitializing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  function loadToday() {
    setInitializing(true);
    trackerApi
      .today()
      .then((data) => {
        if (data.log) {
          const filled = {};
          for (const key of Object.keys(emptyForm)) {
            filled[key] = data.log[key] !== undefined && data.log[key] !== null ? String(data.log[key]) : "";
          }
          setForm(filled);
        }
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }

  function loadHistory() {
    setHistoryLoading(true);
    trackerApi
      .history(7)
      .then((data) => setHistory([...(data.logs || [])].reverse()))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }

  useEffect(() => {
    loadToday();
    loadHistory();
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {};
      for (const [key, value] of Object.entries(form)) {
        if (value !== "") payload[key] = Number(value);
      }
      await trackerApi.upsert(payload);
      setSaved(true);
      loadHistory();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (initializing) {
    return (
      <div className="py-16">
        <LoadingState label="Loading today's log…" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
          <ClipboardList size={22} className="text-brand-500" /> Health Tracker
        </h1>
        <p className="text-sm text-muted">Log today's vitals and lifestyle data — all fields are optional.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card title="Vitals" eyebrow="Today" icon={HeartPulse}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4">
            {VITAL_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={f.key}>
                <div className="relative">
                  <TextInput
                    id={f.key}
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    placeholder="—"
                    value={form[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    className={f.unit ? "pr-16" : ""}
                  />
                  {f.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{f.unit}</span>}
                </div>
              </Field>
            ))}
          </div>
        </Card>

        <Card title="Lifestyle" eyebrow="Today" icon={Activity}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4">
            {LIFESTYLE_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={f.key}>
                <div className="relative">
                  <TextInput
                    id={f.key}
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    placeholder="—"
                    value={form[f.key]}
                    onChange={(e) => updateField(f.key, e.target.value)}
                    className={f.unit ? "pr-16" : ""}
                  />
                  {f.unit && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{f.unit}</span>}
                </div>
              </Field>
            ))}
          </div>
        </Card>

        {error && <ErrorState message={error} />}

        <div className="flex items-center gap-3">
          <Button type="submit" loading={saving} className="flex-1 sm:flex-none">
            Save Today's Log
          </Button>
          {saved && <span className="text-sm text-mint-600 font-medium">✓ Saved</span>}
        </div>
      </form>

      <Card
        title="Last 7 Days"
        eyebrow="History"
        actions={
          <button onClick={loadHistory} className="text-muted hover:text-brand-500 focus-ring rounded-full p-1">
            <RefreshCw size={15} />
          </button>
        }
      >
        {historyLoading ? (
          <LoadingState label="Loading history…" />
        ) : history.length === 0 ? (
          <EmptyState label="No history yet — save today's log to get started." />
        ) : (
          <div className="overflow-x-auto scroll-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted border-b border-black/[0.06]">
                  <th className="py-2 pr-4 font-medium">Date</th>
                  <th className="py-2 pr-4 font-medium">Steps</th>
                  <th className="py-2 pr-4 font-medium">Weight</th>
                  <th className="py-2 pr-4 font-medium">Heart Rate</th>
                  <th className="py-2 pr-4 font-medium">Sleep</th>
                  <th className="py-2 pr-4 font-medium">Calories</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h._id} className="border-b border-black/[0.04] last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-ink">{h.date}</td>
                    <td className="py-2 pr-4 text-ink">{h.steps ?? "—"}</td>
                    <td className="py-2 pr-4 text-ink">{h.weight_kg ?? "—"}</td>
                    <td className="py-2 pr-4 text-ink">{h.heartRate ?? "—"}</td>
                    <td className="py-2 pr-4 text-ink">{h.sleepHours ?? "—"}</td>
                    <td className="py-2 pr-4 text-ink">{h.calories ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
