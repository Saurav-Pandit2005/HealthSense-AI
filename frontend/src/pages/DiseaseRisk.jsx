import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Stethoscope, TrendingUp, TrendingDown, Info, ShieldCheck, UserRound, Droplets, Ruler, Dna, RotateCcw, Lightbulb, ArrowRight, ArrowDownRight, ArrowUpRight, Minus, ChevronDown, History, Trash2 } from "lucide-react";
import { riskApi, profileApi, trackerApi } from "../api/client";
import { Card, Badge } from "../components/ui/Card";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState, LoadingState, EmptyState } from "../components/ui/States";

const F = {
  age: { key: "age", label: "Age", unit: "years", hint: "Pre-filled from your profile", min: 1, max: 120 },
  pregnancies: { key: "pregnancies", label: "Pregnancies", unit: "times", hint: "Enter 0 if male or none", min: 0, max: 20 },
  bmi: { key: "bmi", label: "BMI", unit: "kg/m²", hint: "Healthy range is about 18.5–24.9", min: 0, max: 70 },
  glucose: { key: "glucose", label: "Glucose", unit: "mg/dL", hint: "Plasma glucose; fasting is usually 70–99", min: 0, max: 300 },
  insulin: { key: "insulin", label: "Insulin", unit: "mu U/ml", hint: "2-hour serum insulin", min: 0, max: 900 },
  blood_pressure: { key: "blood_pressure", label: "Blood pressure", unit: "mm Hg", hint: "Diastolic, the lower number (normal is under 80)", min: 0, max: 200 },
  skin_thickness: { key: "skin_thickness", label: "Skin thickness", unit: "mm", hint: "Triceps skinfold measurement", min: 0, max: 100 },
  diabetes_pedigree: { key: "diabetes_pedigree", label: "Family history score", unit: "", hint: "Diabetes pedigree function, roughly 0–2.5", min: 0, max: 3 },
};
const GROUPS = [
  { title: "About you", icon: UserRound, fields: [F.age, F.pregnancies, F.bmi] },
  { title: "Blood tests", icon: Droplets, fields: [F.glucose, F.insulin] },
  { title: "Body measurements", icon: Ruler, fields: [F.blood_pressure, F.skin_thickness] },
  { title: "Family history", icon: Dna, fields: [F.diabetes_pedigree] },
];
const ALL = Object.values(F);
const SAMPLE = { age: "35", pregnancies: "1", bmi: "27.5", glucose: "110", insulin: "90", blood_pressure: "72", skin_thickness: "25", diabetes_pedigree: "0.4" };

const RISK_COLORS = { Low: "rgb(var(--c-mint-500))", Moderate: "rgb(var(--c-amber-500))", High: "rgb(var(--c-coral-500))" };
const RISK_TONE = { Low: "low", Moderate: "moderate", High: "high" };
const SUMMARY = {
  Low: "Your values point to a lower chance of diabetes. Keep up the habits that got you here.",
  Moderate: "Some of your values raise your chance of diabetes. Small lifestyle changes can bring it down.",
  High: "Several of your values raise your chance of diabetes. Please talk to a doctor about getting tested.",
};
// Advice for factors that push the risk up (matched by name, case-insensitive)
const TIPS = [
  ["glucose", "Cut back on sugary drinks and refined carbs, and ask your doctor about a fasting glucose test."],
  ["bmi", "Losing even 5% of your weight can lower your risk. Your meal plan can set a calorie target."],
  ["insulin", "Regular exercise and fewer refined carbs help your body respond better to insulin."],
  ["blood", "Reduce salt, stay active, and keep monitoring your blood pressure."],
  ["pedigree", "You can't change family history, so regular screening matters more for you."],
  ["family", "You can't change family history, so regular screening matters more for you."],
  ["age", "Risk rises with age, so yearly check-ups are a good habit."],
  ["pregnan", "If you had gestational diabetes, get screened every year."],
];

export default function DiseaseRisk() {
  const resultRef = useRef(null);
  const [form, setForm] = useState(Object.fromEntries(ALL.map((f) => [f.key, ""])));
  const [errors, setErrors] = useState({});
  const [maleProfile, setMaleProfile] = useState(false);
  const [result, setResult] = useState(null);
  const [delta, setDelta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    profileApi.get().then(({ profile: p }) => {
      const male = p.gender === "male";
      setMaleProfile(male);
      setForm((prev) => ({ ...prev, age: p.age ? String(p.age) : "", bmi: p.bmi ? String(p.bmi) : "", pregnancies: male ? "0" : prev.pregnancies }));
    }).catch(() => {});

    // Pre-fill diastolic blood pressure from your most recent tracker log
    trackerApi.history(14).then(({ logs }) => {
      const last = [...(logs || [])].filter((l) => l.bp_diastolic).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      if (last) setForm((prev) => (prev.blood_pressure ? prev : { ...prev, blood_pressure: String(last.bp_diastolic) }));
    }).catch(() => {});

    riskApi.history().then((d) => setHistory(d.results || [])).catch(() => {}).finally(() => setHistoryLoading(false));
  }, []);

  function update(key, value) {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function reset() {
    setForm((p) => ({ ...Object.fromEntries(ALL.map((f) => [f.key, ""])), age: p.age, bmi: p.bmi, pregnancies: maleProfile ? "0" : "" }));
    setErrors({});
    setError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    const errs = {};
    for (const f of ALL) {
      const v = form[f.key];
      if (v === "") errs[f.key] = "Required";
      else if (Number(v) < f.min || Number(v) > f.max) errs[f.key] = `Enter a value between ${f.min} and ${f.max}`;
    }
    setErrors(errs);
    if (Object.keys(errs).length) return setError("Please fix the highlighted fields.");

    setLoading(true);
    setResult(null);
    try {
      const payload = {};
      for (const f of ALL) payload[f.key] = Number(form[f.key]);
      const data = await riskApi.predictDiabetes(payload);
      setDelta(history[0] ? +(data.riskPercentage - history[0].riskPercentage).toFixed(1) : null);
      setResult(data);
      setHistory((prev) => [{ ...data, inputData: payload }, ...prev]);
      if (window.innerWidth < 1024) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err.status === 503 ? "The prediction service isn't running right now. Make sure the ML service (FastAPI, port 8000) is started." : err.message);
    } finally {
      setLoading(false);
    }
  }

  const tips = useMemo(() => {
    if (!result) return [];
    const out = [];
    for (const f of result.importantFactors.filter((x) => x.effect === "increases_risk")) {
      const hit = TIPS.find(([k]) => f.factor.toLowerCase().includes(k));
      if (hit && !out.includes(hit[1])) out.push(hit[1]);
    }
    if (!out.length) out.push("Keep moving daily, eat balanced meals, and re-check every few months.");
    return out.slice(0, 3);
  }, [result]);

  const stats = useMemo(() => {
    if (!history.length) return null;
    const pcts = history.map((h) => h.riskPercentage);
    const change = history.length > 1 ? +(history[0].riskPercentage - history[history.length - 1].riskPercentage).toFixed(1) : null;
    return { latest: history[0], count: history.length, lowest: Math.min(...pcts), change };
  }, [history]);

  async function handleDelete(id) {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await riskApi.remove(id);
      setHistory((prev) => prev.filter((h) => (h._id || h.id) !== id));
      setConfirmId(null);
      if (openId === id) setOpenId(null);
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  function reuse(inputData) {
    setForm((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(inputData || {}).filter(([k]) => F[k]).map(([k, v]) => [k, String(v)])) }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }


  return (
    <div className="space-y-6 animate-fadeUp">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
          <Stethoscope size={26} className="text-brand-500" /> Diabetes risk check
        </h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Enter your measurements and the model estimates your chance of diabetes. <strong className="text-ink">This is not a medical diagnosis.</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
        {/* Form */}
        <Card title="Your measurements" eyebrow="Step 1" className="lg:col-span-3"
          actions={
            <div className="flex gap-3 text-xs font-semibold">
              <button type="button" onClick={() => setForm(SAMPLE)} className="text-brand-500 hover:underline">Fill sample data</button>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-muted hover:text-ink"><RotateCcw size={12} /> Reset</button>
            </div>
          }>
          <form onSubmit={handleSubmit} noValidate>
            {GROUPS.map(({ title, icon: Icon, fields }) => (
              <fieldset key={title} className="mb-2">
                <legend className="flex items-center gap-2 text-sm font-semibold text-ink mb-3">
                  <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-600 ring-1 ring-brand-100 grid place-items-center"><Icon size={14} /></span>
                  {title}
                </legend>
                <div className="grid sm:grid-cols-2 gap-x-4">
                  {fields.map((f) => (
                    <Field key={f.key} label={<>{f.label} {f.unit && <span className="text-xs font-normal text-muted">({f.unit})</span>}</>} htmlFor={f.key} hint={f.key === "pregnancies" && maleProfile ? "Set to 0 for your profile" : f.hint} error={errors[f.key]} required>
                      <TextInput id={f.key} type="number" step="any" min={f.min} max={f.max} value={form[f.key]} error={errors[f.key]} disabled={f.key === "pregnancies" && maleProfile} onChange={(e) => update(f.key, e.target.value)} />
                    </Field>
                  ))}
                </div>
              </fieldset>
            ))}
            {error && <div className="mb-4"><ErrorState message={error} /></div>}
            <Button type="submit" loading={loading} className="w-full !py-3">Run risk assessment</Button>
          </form>
        </Card>

        {/* Result */}
        <div ref={resultRef} className="lg:col-span-2 lg:sticky lg:top-20 scroll-mt-20">
          <Card title="Your result" eyebrow="Step 2">
            {loading && <LoadingState label="Analyzing your data…" />}
            {!loading && !result && <EmptyState label="Fill in your measurements and run the assessment to see your result here." />}
            {!loading && result && (
              <div className="animate-fadeUp">
                <div className="flex items-center gap-5 mb-4">
                  <div className="w-28 h-28 rounded-full grid place-items-center shrink-0" style={{ background: `conic-gradient(${RISK_COLORS[result.riskLevel]} ${result.riskPercentage * 3.6}deg, rgb(var(--c-track)) 0deg)` }}>
                    <div className="w-[88px] h-[88px] rounded-full bg-surface flex flex-col items-center justify-center">
                      <span className="font-mono text-2xl font-bold text-ink leading-none">{result.riskPercentage}%</span>
                      <span className="text-[10px] text-muted mt-1">risk</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <Badge tone={RISK_TONE[result.riskLevel]}>{result.riskLevel} risk</Badge>
                    {delta !== null && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-muted">
                        {delta < 0 ? <ArrowDownRight size={14} className="text-mint-600" /> : delta > 0 ? <ArrowUpRight size={14} className="text-coral-500" /> : <Minus size={14} />}
                        {delta === 0 ? "Same as" : `${Math.abs(delta)}% ${delta < 0 ? "lower" : "higher"} than`} last check
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted mb-5">{SUMMARY[result.riskLevel]}</p>

                <h4 className="text-sm font-semibold text-ink mb-2">What affected this result</h4>
                <div className="space-y-1.5 mb-5">
                  {result.importantFactors.map((f) => {
                    const up = f.effect === "increases_risk";
                    return (
                      <div key={f.factor} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                        <span className="flex items-center gap-2 text-sm text-ink">
                          {up ? <TrendingUp size={15} className="text-coral-500" /> : <TrendingDown size={15} className="text-mint-500" />}
                          {f.factor}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className={`text-[11px] font-medium ${up ? "text-coral-500" : "text-mint-600"}`}>{up ? "Raises risk" : "Lowers risk"}</span>
                          <span className="text-xs font-mono text-muted">{f.value}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink mb-2"><Lightbulb size={14} className="text-amber-500" /> What you can do</h4>
                <ul className="space-y-1.5 mb-3 text-sm text-muted list-disc pl-5">{tips.map((t) => <li key={t}>{t}</li>)}</ul>
                <div className="flex gap-4 mb-5 text-sm font-semibold">
                  <Link to="/meal-planner" className="inline-flex items-center gap-1 text-brand-500 hover:underline">Meal plan <ArrowRight size={13} /></Link>
                  <Link to="/fitness-planner" className="inline-flex items-center gap-1 text-brand-500 hover:underline">Fitness plan <ArrowRight size={13} /></Link>
                </div>

                <p className="flex items-center gap-2 text-xs text-muted mb-3">
                  <ShieldCheck size={13} className="shrink-0" />
                  {result.modelInfo?.algorithm} model, ~{Math.round((result.modelInfo?.test_accuracy || 0) * 100)}% test accuracy on the Pima Indians Diabetes Dataset.
                </p>
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3.5 py-3 text-xs text-amber-500">
                  <Info size={14} className="mt-0.5 shrink-0" /> {result.disclaimer}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* History */}
      <Card title="Past assessments" eyebrow="History" icon={History}>
        {historyLoading ? <LoadingState label="Loading history…" /> : !stats ? <EmptyState label="No past assessments yet. Your checks will show up here." /> : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 20 }}>
              <div className="bg-canvas rounded-xl p-4">
                <p className="text-xs text-muted mb-1.5">Latest</p>
                <p className="font-mono text-2xl font-bold text-ink leading-none mb-2">{stats.latest.riskPercentage}%</p>
                <Badge tone={RISK_TONE[stats.latest.riskLevel]}>{stats.latest.riskLevel}</Badge>
              </div>
              <div className="bg-canvas rounded-xl p-4">
                <p className="text-xs text-muted mb-1.5">Since your first check</p>
                <p className={`font-mono text-2xl font-bold leading-none mb-2 ${stats.change === null ? "text-ink" : stats.change < 0 ? "text-mint-600" : stats.change > 0 ? "text-coral-500" : "text-ink"}`}>
                  {stats.change === null ? "—" : `${stats.change > 0 ? "+" : ""}${stats.change}%`}
                </p>
                <p className="text-xs text-muted">{stats.change === null ? "Run another check" : stats.change < 0 ? "Risk went down" : stats.change > 0 ? "Risk went up" : "No change"}</p>
              </div>
              <div className="bg-canvas rounded-xl p-4">
                <p className="text-xs text-muted mb-1.5">Lowest so far</p>
                <p className="font-mono text-2xl font-bold text-ink leading-none mb-2">{stats.lowest}%</p>
                <p className="text-xs text-muted">Your best result</p>
              </div>
              <div className="bg-canvas rounded-xl p-4">
                <p className="text-xs text-muted mb-1.5">Total checks</p>
                <p className="font-mono text-2xl font-bold text-ink leading-none mb-2">{stats.count}</p>
                <p className="text-xs text-muted">Last {Math.min(stats.count, 20)} are kept</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {history.slice(0, 10).map((r, i) => {
                const id = r._id || r.id || i;
                const older = history[i + 1];
                const d = older ? +(r.riskPercentage - older.riskPercentage).toFixed(1) : null;
                const open = openId === id;
                const entries = Object.entries(r.inputData || {}).filter(([k]) => F[k]);
                return (
                  <div key={id} className="border border-line/[0.08] rounded-2xl overflow-hidden">
                    <div className="flex items-center">
                    <button type="button" onClick={() => setOpenId(open ? null : id)} aria-expanded={open}
                      className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left hover:bg-canvas transition-colors focus-ring">
                      <span style={{ width: 10, height: 10, borderRadius: 999, flexShrink: 0, background: RISK_COLORS[r.riskLevel] }} />
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold text-ink">{r.createdAt ? new Date(r.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                        <span className="block text-xs text-muted">{r.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                      </span>
                      {d !== null && (
                        <span className={`hidden sm:inline-flex items-center gap-0.5 text-xs font-semibold ${d < 0 ? "text-mint-600" : d > 0 ? "text-coral-500" : "text-muted"}`}>
                          {d < 0 ? <ArrowDownRight size={14} /> : d > 0 ? <ArrowUpRight size={14} /> : <Minus size={14} />}
                          {d === 0 ? "Same" : `${Math.abs(d)}%`}
                        </span>
                      )}
                      <span className="font-mono text-base font-bold text-ink">{r.riskPercentage}%</span>
                      <Badge tone={RISK_TONE[r.riskLevel]}>{r.riskLevel}</Badge>
                      <ChevronDown size={16} className="text-muted shrink-0 transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
                    </button>
                    <span aria-hidden="true" style={{ width: 1, height: 24, flexShrink: 0, background: "rgb(var(--c-line) / 0.1)" }} />
                    <button type="button" aria-label="Delete this check" title="Delete this check" onClick={() => { setConfirmId(confirmId === id ? null : id); setDeleteError(null); }}
                      className={`text-muted hover:text-coral-500 hover:bg-coral-50 transition-colors focus-ring ${confirmId === id ? "bg-coral-50 text-coral-500" : ""}`}
                      style={{ width: 38, height: 38, margin: "0 12px 0 10px", flexShrink: 0, display: "grid", placeItems: "center", borderRadius: 10 }}>
                      <Trash2 size={16} />
                    </button>
                    </div>

                    {confirmId === id && (
                      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line/[0.06] bg-coral-50 px-4 py-3">
                        <p className="text-sm font-medium text-coral-500">
                          {deleteError || "Delete this check? This can't be undone."}
                        </p>
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setConfirmId(null)} className="text-xs font-semibold text-muted hover:text-ink px-3 py-1.5">Cancel</button>
                          <button type="button" disabled={deletingId === id} onClick={() => handleDelete(id)} className="text-xs font-semibold rounded-lg px-3 py-1.5 disabled:opacity-60" style={{ background: "#DB4A28", color: "#fff" }}>
                            {deletingId === id ? "Deleting…" : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}

                    {open && (
                      <div className="border-t border-line/[0.06] bg-canvas px-4 py-4">
                        {entries.length > 0 ? (
                          <>
                            <p className="text-xs font-semibold text-muted mb-3">Values you entered{older?.inputData ? " (and how they changed)" : ""}</p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10 }}>
                              {entries.map(([k, v]) => {
                                const was = older?.inputData?.[k];
                                const changed = was !== undefined && was !== v;
                                return (
                                  <div key={k} className="bg-surface rounded-lg px-3 py-2.5">
                                    <p className="text-[11px] text-muted">{F[k].label}</p>
                                    <p className="font-mono text-sm font-semibold text-ink">
                                      {v} <span className="text-[10px] font-normal text-muted">{F[k].unit}</span>
                                    </p>
                                    {changed && (
                                      <p className="flex items-center gap-0.5 text-[11px] text-muted mt-0.5">
                                        {v < was ? <ArrowDownRight size={11} /> : <ArrowUpRight size={11} />} was {was}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {r.importantFactors?.length > 0 && (
                              <p className="text-xs text-muted mt-3">
                                Main factors: {r.importantFactors.slice(0, 3).map((f) => f.factor).join(", ")}
                              </p>
                            )}
                            <button type="button" onClick={() => reuse(r.inputData)} className="mt-3 text-xs font-semibold text-brand-500 hover:underline">
                              Use these values in a new check
                            </button>
                          </>
                        ) : (
                          <p className="text-xs text-muted">The values for this check weren't saved.</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
