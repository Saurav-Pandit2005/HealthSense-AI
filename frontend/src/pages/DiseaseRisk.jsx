import { useEffect, useState } from "react";
import { Stethoscope, TrendingUp, TrendingDown, Info, ShieldCheck } from "lucide-react";
import { riskApi, profileApi } from "../api/client";
import { Card, Badge } from "../components/ui/Card";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState, LoadingState, EmptyState } from "../components/ui/States";

const FIELDS = [
  { key: "pregnancies", label: "Pregnancies", hint: "0 if male or no history", min: 0, max: 20 },
  { key: "glucose", label: "Glucose Level", hint: "mg/dL, plasma concentration", min: 0, max: 300 },
  { key: "blood_pressure", label: "Blood Pressure (Diastolic)", hint: "mm Hg — lower number in a BP reading", min: 0, max: 200 },
  { key: "skin_thickness", label: "Skin Thickness", hint: "mm, triceps skinfold", min: 0, max: 100 },
  { key: "insulin", label: "Insulin Level", hint: "mu U/ml, 2-hour serum", min: 0, max: 900 },
  { key: "bmi", label: "BMI", hint: "Pre-filled from your profile if available", min: 0, max: 70 },
  { key: "diabetes_pedigree", label: "Diabetes Pedigree", hint: "Family history score, roughly 0–2.5", min: 0, max: 3 },
  { key: "age", label: "Age", hint: "Pre-filled from your profile if available", min: 1, max: 120 },
];

const RISK_COLORS = { Low: "#17AB83", Moderate: "#CC8A1F", High: "#DB4A28" };
const RISK_TONE = { Low: "low", Moderate: "moderate", High: "high" };

export default function DiseaseRisk() {
  const [form, setForm] = useState(Object.fromEntries(FIELDS.map((f) => [f.key, ""])));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    profileApi
      .get()
      .then((data) => {
        const p = data.profile;
        setForm((prev) => ({
          ...prev,
          age: p.age ? String(p.age) : "",
          bmi: p.bmi ? String(p.bmi) : "",
        }));
      })
      .catch(() => {});

    riskApi
      .history()
      .then((data) => setHistory(data.results || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, []);

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const missing = FIELDS.filter((f) => form[f.key] === "");
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(", ")}`);
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const payload = {};
      for (const f of FIELDS) payload[f.key] = Number(form[f.key]);
      const data = await riskApi.predictDiabetes(payload);
      setResult(data);
      setHistory((prev) => [{ ...data, riskLevel: data.riskLevel, riskPercentage: data.riskPercentage, createdAt: data.createdAt }, ...prev]);
    } catch (err) {
      if (err.status === 503) {
        setError("The prediction service isn't running right now. Make sure the ML service (FastAPI, port 8000) is started.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
          <Stethoscope size={22} className="text-brand-500" /> Diabetes Risk Assessment
        </h1>
        <p className="text-sm text-muted max-w-2xl">
          Enter your clinical measurements below. The model estimates your diabetes risk from these values —{" "}
          <strong className="text-ink">this is not a medical diagnosis.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card title="Clinical Measurements" eyebrow="Assessment" className="lg:col-span-2 h-fit">
          <form onSubmit={handleSubmit} noValidate>
            {FIELDS.map((f) => (
              <Field key={f.key} label={f.label} htmlFor={f.key} hint={f.hint} required>
                <TextInput
                  id={f.key}
                  type="number"
                  step="any"
                  min={f.min}
                  max={f.max}
                  value={form[f.key]}
                  onChange={(e) => update(f.key, e.target.value)}
                />
              </Field>
            ))}
            {error && (
              <div className="mb-4">
                <ErrorState message={error} />
              </div>
            )}
            <Button type="submit" loading={loading} className="w-full">
              Run Risk Assessment
            </Button>
          </form>
        </Card>

        <Card title="Assessment Result" eyebrow="Results" className="lg:col-span-3">
          {loading && <LoadingState label="Analyzing your data…" />}
          {!loading && !result && <EmptyState label="Fill in your clinical measurements and run the assessment to see your result." />}
          {!loading && result && (
            <div className="animate-fadeUp">
              <div className="flex items-center gap-5 mb-6">
                <div
                  className="w-24 h-24 rounded-full flex items-center justify-center relative shrink-0"
                  style={{ background: `conic-gradient(${RISK_COLORS[result.riskLevel]} ${result.riskPercentage * 3.6}deg, #EEF2F6 0deg)` }}
                >
                  <div className="w-[70px] h-[70px] rounded-full bg-white flex items-center justify-center">
                    <span className="font-mono text-lg font-bold text-ink">{result.riskPercentage}%</span>
                  </div>
                </div>
                <div>
                  <Badge tone={RISK_TONE[result.riskLevel]}>{result.riskLevel} Risk</Badge>
                  <p className="text-sm text-muted mt-2">Based on the clinical measurements you provided.</p>
                </div>
              </div>

              <h4 className="text-sm font-semibold text-ink mb-2">Important Factors</h4>
              <div className="space-y-2 mb-6">
                {result.importantFactors.map((f) => (
                  <div key={f.factor} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      {f.effect === "increases_risk" ? (
                        <TrendingUp size={15} className="text-coral-500" />
                      ) : (
                        <TrendingDown size={15} className="text-mint-500" />
                      )}
                      <span className="text-sm text-ink">{f.factor}</span>
                    </div>
                    <span className="text-xs font-mono text-muted">{f.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted mb-4">
                <ShieldCheck size={13} />
                {result.modelInfo?.algorithm} model, ~{Math.round((result.modelInfo?.test_accuracy || 0) * 100)}% test accuracy on the Pima Indians Diabetes Dataset.
              </div>

              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-3 text-xs text-amber-500">
                <Info size={14} className="mt-0.5 shrink-0" />
                {result.disclaimer}
              </div>
            </div>
          )}
        </Card>
      </div>

      <Card title="Past Assessments" eyebrow="History">
        {historyLoading ? (
          <LoadingState label="Loading history…" />
        ) : history.length === 0 ? (
          <EmptyState label="No past assessments yet." />
        ) : (
          <div className="space-y-2">
            {history.slice(0, 10).map((r, i) => (
              <div key={r.id || i} className="flex items-center justify-between border-b border-black/[0.04] last:border-0 py-2">
                <span className="text-xs font-mono text-muted">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "—"}
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-ink">{r.riskPercentage}%</span>
                  <Badge tone={RISK_TONE[r.riskLevel]}>{r.riskLevel}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
