import { useEffect, useLayoutEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { Link } from "react-router-dom";
import { FileText, Download, Check, Minus, ArrowRight, ClipboardCheck } from "lucide-react";
import { profileApi, dashboardApi, riskApi, fitnessApi, mealApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button, ChipToggle } from "../components/ui/Field";
import { LoadingState, ErrorState } from "../components/ui/States";

const GOAL_LABELS = { lose_weight: "Lose Weight", gain_muscle: "Gain Muscle", maintain: "Maintain Weight", general_fitness: "General Fitness" };
const PAGE_W = 794; // A4 width at 96 dpi, so the preview and the PDF page match

// One failing endpoint (e.g. no risk assessment yet) shouldn't block the whole report
async function safeFetch(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

// Everything inside the report uses inline styles with plain hex colours and an explicit font,
// because html2canvas is unreliable with utility classes and modern CSS colour functions.
const font = "'Georgia', 'Times New Roman', serif";
const S = {
  page: { width: PAGE_W, boxSizing: "border-box", fontFamily: font, color: "#1a1a1a", background: "#ffffff", padding: "34px 38px 28px" },
  title: { fontFamily: font, fontSize: 25, fontWeight: 700, margin: 0, color: "#0F5757" },
  small: { fontFamily: font, fontSize: 12, color: "#555555", margin: "3px 0 0" },
  rule: { border: "none", borderTop: "2px solid #0F5757", margin: "14px 0 16px" },
  secTitle: { fontFamily: font, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "#0F5757", borderBottom: "1px solid #cfdcdc", paddingBottom: 4, margin: "0 0 8px" },
  row: { display: "flex", padding: "2.5px 0", fontFamily: font, fontSize: 12.5, lineHeight: 1.35 },
  label: { width: 104, flexShrink: 0, fontWeight: 700, color: "#1a1a1a" },
  value: { color: "#333333", flex: 1 },
  muted: { fontFamily: font, fontSize: 12, color: "#777777", fontStyle: "italic", margin: 0 },
  kpi: { border: "1px solid #d9e5e5", background: "#f3f8f8", borderRadius: 6, padding: "9px 12px" },
  kpiLabel: { fontFamily: font, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#5a6b6b", margin: 0 },
  kpiValue: { fontFamily: font, fontSize: 21, fontWeight: 700, color: "#0F5757", margin: "3px 0 1px" },
  kpiSub: { fontFamily: font, fontSize: 11, color: "#555555", margin: 0 },
  th: { textAlign: "left", padding: "3px 6px", borderBottom: "1px solid #999999", fontWeight: 700, fontSize: 11.5 },
  td: { padding: "3px 6px", borderBottom: "1px solid #e8e8e8", color: "#333333", fontSize: 11.5 },
  disclaimer: { fontFamily: font, fontSize: 10.5, color: "#777777", margin: "16px 0 0", paddingTop: 10, borderTop: "1px solid #cccccc", lineHeight: 1.45 },
};

const Section = ({ title, children }) => (
  <div style={{ marginBottom: 16 }}>
    <p style={S.secTitle}>{title}</p>
    {children}
  </div>
);
const Row = ({ label, value }) => (
  <div style={S.row}>
    <span style={S.label}>{label}</span>
    <span style={S.value}>{value ?? "—"}</span>
  </div>
);
const Kpi = ({ label, value, sub }) => (
  <div style={S.kpi}>
    <p style={S.kpiLabel}>{label}</p>
    <p style={S.kpiValue}>{value}</p>
    <p style={S.kpiSub}>{sub}</p>
  </div>
);


function buildOverview({ profile, dashboard, latestRisk, fitnessPlan, mealPlan }) {
  const score = dashboard?.healthScore;
  const hasScore = score !== null && score !== undefined;
  const risky = latestRisk && latestRisk.riskLevel !== "Low";

  const included = [
    { label: "Personal information", sub: "Age, height, weight, blood group, allergies, lifestyle", ok: !!profile, fix: ["/profile-setup", "Complete profile"] },
    { label: "Today's snapshot", sub: "Steps, sleep, water, heart rate, blood pressure", ok: !!dashboard?.todayLog, fix: ["/tracker", "Log today"] },
    { label: "Disease risk assessment", sub: "Your latest diabetes risk check", ok: !!latestRisk, fix: ["/disease-risk", "Run a check"] },
    { label: "Fitness plan", sub: "Your weekly workout schedule", ok: !!fitnessPlan, fix: ["/profile-setup", "Complete profile"] },
    { label: "Meal plan", sub: "Calorie target, macros and meal ideas", ok: !!mealPlan, fix: ["/profile-setup", "Complete profile"] },
  ];

  const points = [];
  points.push(hasScore ? `Your health score today is ${score}/100 (${score >= 70 ? "good" : score >= 40 ? "fair" : "needs attention"}).` : "No health data was logged today, so a health score could not be calculated.");
  if (profile?.bmi) points.push(`Your BMI is ${profile.bmi}, in the ${String(profile.bmiCategory || "").toLowerCase()} range.`);
  points.push(latestRisk ? `Your latest diabetes risk check shows ${latestRisk.riskPercentage}% (${latestRisk.riskLevel.toLowerCase()} risk).` : "You haven't run a diabetes risk check yet.");
  if (fitnessPlan || mealPlan) {
    const w = fitnessPlan ? fitnessPlan.weeklyPlan.filter((d) => d.durationMinutes > 0).length : 0;
    const parts = [fitnessPlan && `${w} workout days a week`, mealPlan && `${mealPlan.dailyCalories.toLocaleString()} kcal a day`].filter(Boolean);
    points.push(`Your plan: ${parts.join(" and ")}${fitnessPlan ? `, for ${GOAL_LABELS[fitnessPlan.goal] || fitnessPlan.goal}` : ""}.`);
  }

  const conclusion = risky
    ? "Overall, some of your results need attention. Please discuss your risk result with a doctor."
    : hasScore && score >= 70 && latestRisk
    ? "Overall, your numbers look healthy. Keep up your routine and re-check every few months."
    : "Overall, this is a good start. Log your data regularly to build a clearer picture of your health.";

  const next = [];
  if (!dashboard?.todayLog) next.push("Log today's steps, sleep and water in the Tracker.");
  if (!latestRisk) next.push("Run a diabetes risk check.");
  if (risky) next.push("Book a check-up with your doctor and share this report.");
  if (!next.length) next.push("Share this report with your doctor at your next visit.");

  return { included, points, conclusion, next: next.slice(0, 3), ready: included.filter((i) => i.ok).length };
}

const Info = ({ label, value, span }) => (
  <div style={{ gridColumn: span ? `span ${span}` : undefined, minWidth: 0 }}>
    <p style={{ fontFamily: font, fontSize: 9.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7a8a8a", margin: 0 }}>{label}</p>
    <p style={{ fontFamily: font, fontSize: 13, color: "#1a1a1a", margin: "2px 0 0", lineHeight: 1.3 }}>{value ?? "—"}</p>
  </div>
);
const Grid = ({ cols = 3, children }) => <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "12px 14px" }}>{children}</div>;

function Report({ user, today, profile, dashboard, latestRisk, riskHistory = [], fitnessPlan, mealPlan }) {
  const log = dashboard?.todayLog;
  const score = dashboard?.healthScore;
  const hasScore = score !== null && score !== undefined;
  // "Number of pregnancies" doesn't apply to male profiles, so leave it out of the factors
  const topFactors = (latestRisk?.importantFactors || [])
    .filter((f) => !(profile?.gender === "male" && /pregnan/i.test(f.factor)))
    .slice(0, 3)
    .map((f) => f.factor)
    .join(", ");
  const shortDate = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "");
  const week = fitnessPlan?.weeklyPlan || [];
  const maxMin = Math.max(...week.map((d) => d.durationMinutes), 1);
  const list = (a) => (a?.length ? a.join(", ") : "None");

  return (
    <div style={S.page}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={S.title}>HealthSense AI</h1>
          <p style={S.small}>Personal Health Report</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ ...S.small, margin: 0, fontWeight: 700, color: "#1a1a1a", fontSize: 13 }}>{user?.name}</p>
          <p style={S.small}>{today}</p>
        </div>
      </div>
      <hr style={S.rule} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        <Kpi label="Health score" value={hasScore ? `${score}/100` : "—"} sub={hasScore ? "Today" : "No data logged"} />
        <Kpi label="BMI" value={profile?.bmi ?? "—"} sub={profile?.bmiCategory || "—"} />
        <Kpi label="Diabetes risk" value={latestRisk ? `${latestRisk.riskPercentage}%` : "—"} sub={latestRisk ? `${latestRisk.riskLevel} risk` : "Not yet assessed"} />
        <Kpi label="Daily calories" value={mealPlan ? mealPlan.dailyCalories.toLocaleString() : "—"} sub="kcal target" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
        <Section title="Personal details">
          {profile ? (
            <Grid>
              <Info label="Age" value={profile.age ? `${profile.age} yrs` : null} />
              <Info label="Gender" value={profile.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : null} />
              <Info label="Blood group" value={profile.bloodGroup} />
              <Info label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
              <Info label="Weight" value={profile.weight_kg ? `${profile.weight_kg} kg` : null} />
              <Info label="Smoking / Alcohol" value={`${profile.smoking ? "Yes" : "No"} / ${profile.alcohol ? "Yes" : "No"}`} />
              <Info label="Allergies" value={list(profile.allergies)} span={1} />
              <Info label="Medical history" value={list(profile.medicalHistory)} span={2} />
            </Grid>
          ) : (
            <p style={S.muted}>Profile data unavailable.</p>
          )}
        </Section>

        <div>
          <Section title="Today's snapshot">
            {log ? (
              <Grid>
                <Info label="Steps" value={log.steps} />
                <Info label="Sleep" value={log.sleepHours ? `${log.sleepHours} hrs` : null} />
                <Info label="Water" value={log.waterIntakeL ? `${log.waterIntakeL} L` : null} />
                <Info label="Heart rate" value={log.heartRate ? `${log.heartRate} bpm` : null} />
                <Info label="Blood pressure" value={log.bp_systolic ? `${log.bp_systolic}/${log.bp_diastolic}` : null} />
                <Info label="Weight" value={log.weight_kg ? `${log.weight_kg} kg` : null} />
              </Grid>
            ) : (
              <p style={S.muted}>No data logged today.</p>
            )}
          </Section>
          <Section title="Diabetes risk">
            {latestRisk ? (
              <Grid cols={1}>
                <Info label="Main factors" value={topFactors || "—"} />
                {riskHistory.length > 1 && <Info label="Recent checks" value={riskHistory.slice(0, 4).map((r) => `${shortDate(r.createdAt)}: ${r.riskPercentage}%`).join("   ·   ")} />}
              </Grid>
            ) : (
              <p style={S.muted}>Not yet assessed.</p>
            )}
          </Section>
        </div>
      </div>

      <Section title={`Weekly fitness plan${fitnessPlan ? " · " + (GOAL_LABELS[fitnessPlan.goal] || fitnessPlan.goal) : ""}`}>
        {week.length ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8 }}>
            {week.map((d) => {
              const rest = !d.durationMinutes;
              return (
                <div key={d.day} style={{ border: "1px solid #e0eaea", borderRadius: 6, padding: "7px 8px 8px", background: rest ? "#fafafa" : "#ffffff" }}>
                  <div style={{ height: 3, background: "#e6eeee", borderRadius: 2, marginBottom: 6 }}>
                    <div style={{ height: 3, width: `${(d.durationMinutes / maxMin) * 100}%`, background: "#1FA589", borderRadius: 2 }} />
                  </div>
                  <p style={{ fontFamily: font, fontSize: 11, fontWeight: 700, margin: 0 }}>{d.day.slice(0, 3)}</p>
                  <p style={{ fontFamily: font, fontSize: 11, margin: "1px 0 0", color: rest ? "#888888" : "#333333" }}>{rest ? "Rest" : d.focus}</p>
                  <p style={{ fontFamily: font, fontSize: 10.5, margin: "1px 0 0", color: "#777777" }}>{rest ? "—" : `${d.durationMinutes} min`}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={S.muted}>Not yet generated.</p>
        )}
      </Section>

      <Section title="Meal plan">
        {mealPlan ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <Grid cols={4}>
                <Info label="Calories" value={`${mealPlan.dailyCalories.toLocaleString()} kcal`} />
                <Info label="Protein" value={`${mealPlan.macroSplit.protein}%`} />
                <Info label="Carbs" value={`${mealPlan.macroSplit.carbs}%`} />
                <Info label="Fat" value={`${mealPlan.macroSplit.fat}%`} />
              </Grid>
            </div>
            <Grid cols={4}>
              <Info label="Breakfast" value={mealPlan.meals.breakfast?.[0]} />
              <Info label="Lunch" value={mealPlan.meals.lunch?.[0]} />
              <Info label="Snack" value={mealPlan.meals.snack?.[0]} />
              <Info label="Dinner" value={mealPlan.meals.dinner?.[0]} />
            </Grid>
          </>
        ) : (
          <p style={S.muted}>Not yet generated.</p>
        )}
      </Section>

      <p style={{ ...S.disclaimer, margin: "6px 0 0" }}>For information only. This report is not a substitute for professional medical advice, diagnosis or treatment.</p>
    </div>
  );
}

export default function HealthReport() {
  const { user } = useAuth();
  const reportRef = useRef(null); // full-size copy used for the PDF (kept off-screen)
  const wrapRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [fit, setFit] = useState(true); // opens in "Fit to screen"
  const [scale, setScale] = useState(1);
  const [paperH, setPaperH] = useState(1000);

  useEffect(() => {
    Promise.all([safeFetch(profileApi.get()), safeFetch(dashboardApi.summary()), safeFetch(riskApi.history()), safeFetch(fitnessApi.plan()), safeFetch(mealApi.plan("vegetarian"))]).then(
      ([p, d, r, f, m]) => {
        setData({ profile: p?.profile || null, dashboard: d || null, latestRisk: r?.results?.[0] || null, riskHistory: r?.results || [], fitnessPlan: f?.plan || null, mealPlan: m?.plan || null });
        setLoading(false);
      }
    );
  }, []);

  // Scale the on-screen preview so the whole page fits the window (no scrolling); "100%" shows it full size
  useLayoutEffect(() => {
    if (!data) return;
    function calc() {
      const h = reportRef.current?.offsetHeight || 1000;
      setPaperH(h);
      if (!fit) return setScale(1);
      const availW = wrapRef.current?.clientWidth || PAGE_W;
      const availH = window.innerHeight - 190;
      const paperAvail = availW >= 1000 ? availW - 340 - 24 : availW;
      setScale(Math.max(0.4, Math.min(1, paperAvail / PAGE_W, availH / h)));
    }
    calc();
    window.addEventListener("resize", calc);
    const ro = typeof ResizeObserver !== "undefined" && reportRef.current ? new ResizeObserver(calc) : null;
    if (ro) ro.observe(reportRef.current);
    return () => {
      window.removeEventListener("resize", calc);
      if (ro) ro.disconnect();
    };
  }, [data, fit]);

  async function handleDownload() {
    setDownloadError(null);
    setDownloading(true);
    try {
      if (document.fonts?.ready) await document.fonts.ready;
      const canvas = await html2canvas(reportRef.current, { backgroundColor: "#ffffff", useCORS: true, scale: 2, windowWidth: PAGE_W });
      const img = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pw = pdf.internal.pageSize.getWidth();
      const ph = pdf.internal.pageSize.getHeight();
      const ih = (canvas.height * pw) / canvas.width;
      let left = ih;
      let pos = 0;
      pdf.addImage(img, "JPEG", 0, pos, pw, ih);
      left -= ph;
      while (left > 0) {
        pos = left - ih;
        pdf.addPage();
        pdf.addImage(img, "JPEG", 0, pos, pw, ih);
        left -= ph;
      }
      pdf.save(`HealthSense-Report-${(user?.name || "user").replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError("PDF generation failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <div className="py-16"><LoadingState label="Gathering your health data…" /></div>;

  const overview = buildOverview(data);
  const props = { user, today: new Date().toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" }), ...data };

  return (
    <div className="space-y-4 animate-fadeUp">
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
            <FileText size={24} className="text-brand-500" /> Health report
          </h1>
          <p className="text-sm text-muted mt-1">A one-page summary of your health data. The preview is exactly what the PDF contains.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChipToggle selected={fit} onClick={() => setFit(true)}>Fit to screen</ChipToggle>
          <ChipToggle selected={!fit} onClick={() => setFit(false)}>100%</ChipToggle>
          <Button onClick={handleDownload} loading={downloading}>
            <Download size={16} /> Download PDF
          </Button>
        </div>
      </div>

      {downloadError && <ErrorState message={downloadError} />}

      {/* Preview (left) + overview (right) */}
      <div ref={wrapRef} style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "stretch" }}>
        <div style={{ flex: "0 0 auto", maxWidth: "100%", display: "flex", ...(fit ? {} : { overflowX: "auto", overflowY: "hidden" }) }}>
          <div style={{ position: "relative", width: PAGE_W * scale, minHeight: paperH * scale, background: "#fff", borderRadius: 4, overflow: "hidden", boxShadow: "0 10px 40px -12px rgba(0,0,0,0.45)" }}>
            <div style={{ position: "absolute", top: 0, left: 0, width: PAGE_W, transform: `scale(${scale})`, transformOrigin: "top left" }}>
              <Report {...props} />
            </div>
          </div>
        </div>

        <div style={{ flex: "1 1 320px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Card title="About this report" eyebrow="Overview" icon={ClipboardCheck} className="flex-1">
            <p className="text-xs text-muted mb-4">Built from your account data · <span className="font-semibold text-ink">{overview.ready} of {overview.included.length}</span> sections have data.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28 }}>
              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">What's included</h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                  {overview.included.map((i) => (
                    <li key={i.label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span className={i.ok ? "bg-mint-50 text-mint-600" : "bg-canvas text-muted"} style={{ width: 22, height: 22, borderRadius: 999, flexShrink: 0, display: "grid", placeItems: "center", marginTop: 1 }}>
                        {i.ok ? <Check size={13} strokeWidth={3} /> : <Minus size={13} />}
                      </span>
                      <span className="flex-1 flex flex-wrap items-center justify-between gap-x-3" title={i.sub}>
                        <span className="text-sm font-medium text-ink">{i.label}</span>
                        {!i.ok && (
                          <Link to={i.fix[0]} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-500 hover:underline">
                            {i.fix[1]} <ArrowRight size={11} />
                          </Link>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-ink mb-3">Summary</h3>
                <ul className="space-y-1.5 mb-4">
                  {overview.points.map((t, i) => (
                    <li key={i} className="text-sm text-muted flex gap-2">
                      <span className="text-brand-500">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
                <div className="bg-brand-50 border border-brand-100 rounded-xl" style={{ padding: "12px 14px" }}>
                  <p className="text-xs font-semibold text-brand-600 mb-1">Conclusion</p>
                  <p className="text-sm text-ink">{overview.conclusion}</p>
                </div>
                <h3 className="text-sm font-semibold text-ink mt-5 mb-2">Next steps</h3>
                <ul className="space-y-1.5">
                  {overview.next.map((t, i) => (
                    <li key={i} className="text-sm text-muted flex gap-2">
                      <ArrowRight size={14} className="text-brand-500 mt-0.5 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="text-[11px] text-muted mt-4">This is an automatic summary of your data, not a medical diagnosis.</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Full-size copy used only to build the PDF (off-screen) */}
      <div aria-hidden="true" style={{ position: "absolute", left: -10000, top: 0, width: PAGE_W }}>
        <div ref={reportRef}>
          <Report {...props} />
        </div>
      </div>
    </div>
  );
}
