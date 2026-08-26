import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FileText, Download, Lightbulb } from "lucide-react";
import { profileApi, dashboardApi, riskApi, fitnessApi, mealApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Field";
import { LoadingState, ErrorState } from "../components/ui/States";

const GOAL_LABELS = {
  lose_weight: "Lose Weight",
  gain_muscle: "Gain Muscle",
  maintain: "Maintain Weight",
  general_fitness: "General Fitness",
};

// Settled-promise helper so one failing endpoint (e.g. no risk assessment
// done yet) doesn't block the whole report from rendering.
async function safeFetch(promise) {
  try {
    return await promise;
  } catch {
    return null;
  }
}

// Inline, explicit styles for everything INSIDE the PDF-captured area.
// Deliberately not using Tailwind utility classes here — html2canvas has
// historically mis-rendered/dropped fonts and modern CSS color functions
// when relying on utility classes, so plain hex colors + explicit
// font-family are used throughout this component instead.
const reportFont = "'Georgia', 'Times New Roman', serif";
const styles = {
  page: { fontFamily: reportFont, color: "#1a1a1a", backgroundColor: "#ffffff", padding: "40px" },
  h1: { fontFamily: reportFont, fontSize: "26px", fontWeight: 700, margin: 0, color: "#0F5757" },
  small: { fontFamily: reportFont, fontSize: "13px", color: "#555555" },
  hr: { border: "none", borderTop: "2px solid #1a1a1a", margin: "16px 0 24px" },
  hrLight: { border: "none", borderTop: "1px solid #cccccc", margin: "6px 0 14px" },
  sectionTitle: { fontFamily: reportFont, fontSize: "15px", fontWeight: 700, letterSpacing: "0.03em", color: "#1a1a1a", margin: "0 0 4px" },
  row: { display: "flex", padding: "5px 0", fontFamily: reportFont, fontSize: "13.5px" },
  label: { width: "200px", fontWeight: 700, color: "#1a1a1a", flexShrink: 0 },
  value: { color: "#333333" },
  muted: { fontFamily: reportFont, fontSize: "13px", color: "#777777", fontStyle: "italic" },
  table: { width: "100%", borderCollapse: "collapse", fontFamily: reportFont, fontSize: "12.5px" },
  th: { textAlign: "left", padding: "6px 10px", borderBottom: "1px solid #999999", fontWeight: 700, color: "#1a1a1a" },
  td: { padding: "6px 10px", borderBottom: "1px solid #e5e5e5", color: "#333333" },
  disclaimer: { fontFamily: reportFont, fontSize: "11.5px", color: "#777777", marginTop: "24px", paddingTop: "14px", borderTop: "1px solid #cccccc" },
};

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <p style={styles.sectionTitle}>{title}</p>
      <hr style={styles.hrLight} />
      {children}
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={styles.row}>
      <span style={styles.label}>{label}:</span>
      <span style={styles.value}>{value ?? "—"}</span>
    </div>
  );
}

export default function HealthReport() {
  const { user } = useAuth();
  const reportRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  useEffect(() => {
    Promise.all([
      safeFetch(profileApi.get()),
      safeFetch(dashboardApi.summary()),
      safeFetch(riskApi.history()),
      safeFetch(fitnessApi.plan()),
      safeFetch(mealApi.plan("vegetarian")),
    ]).then(([profileRes, dashboardRes, riskRes, fitnessRes, mealRes]) => {
      setData({
        profile: profileRes?.profile || null,
        dashboard: dashboardRes || null,
        latestRisk: riskRes?.results?.[0] || null,
        fitnessPlan: fitnessRes?.plan || null,
        mealPlan: mealRes?.plan || null,
      });
      setLoading(false);
    });
  }, []);

  async function handleDownload() {
    setDownloadError(null);
    setDownloading(true);
    try {
      // Make sure any web fonts are fully loaded before the snapshot is
      // taken — capturing too early is a common cause of a PDF rendering
      // with a fallback system font instead of the intended one.
      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: "#ffffff",
        useCORS: true,
        scale: 1.5,
      });

      // JPEG at 0.92 quality keeps the report crisp and readable while
      // keeping file size reasonable — a full-quality PNG of a tall report
      // can balloon to 30+ MB, which is a poor download experience.
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const dateStr = new Date().toISOString().slice(0, 10);
      const safeName = (user?.name || "user").replace(/\s+/g, "-");
      pdf.save(`HealthSense-Report-${safeName}-${dateStr}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      setDownloadError("PDF generation failed. Please try again, or use your browser's Print → Save as PDF option.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16">
        <LoadingState label="Gathering your health data…" />
      </div>
    );
  }

  const { profile, dashboard, latestRisk, fitnessPlan, mealPlan } = data;
  const today = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink flex items-center gap-2">
            <FileText size={22} className="text-brand-500" /> Health Report
          </h1>
          <p className="text-sm text-muted">Download a PDF summary of your complete health data</p>
        </div>
        <Button onClick={handleDownload} loading={downloading}>
          <Download size={16} /> Download PDF
        </Button>
      </div>

      {downloadError && <ErrorState message={downloadError} />}

      <div className="bg-brand-50 border border-brand-100 text-brand-600 rounded-lg px-4 py-3 text-sm flex items-center gap-2">
        <Lightbulb size={15} />
        The report below is exactly what will appear in the PDF. Tip: you can also use <strong>Ctrl+P → Save as PDF</strong> in your browser.
      </div>

      <div className="bg-surface rounded-2xl shadow-card border border-black/[0.04] overflow-hidden">
        <div ref={reportRef} style={styles.page}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={styles.h1}>HealthSense AI</h1>
              <p style={styles.small}>Personal Health Report</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ ...styles.small, fontWeight: 700, color: "#1a1a1a" }}>{user?.name}</p>
              <p style={styles.small}>Generated: {today}</p>
            </div>
          </div>
          <hr style={styles.hr} />

          <Section title="A. PERSONAL INFORMATION">
            {profile ? (
              <>
                <Row label="Name" value={profile.name} />
                <Row label="Age" value={profile.age ? `${profile.age} years` : null} />
                <Row label="Gender" value={profile.gender ? profile.gender[0].toUpperCase() + profile.gender.slice(1) : null} />
                <Row label="Height" value={profile.height_cm ? `${profile.height_cm} cm` : null} />
                <Row label="Weight" value={profile.weight_kg ? `${profile.weight_kg} kg` : null} />
                <Row label="BMI" value={profile.bmi ? `${profile.bmi} (${profile.bmiCategory})` : null} />
                <Row label="Blood Group" value={profile.bloodGroup} />
                <Row label="Allergies" value={profile.allergies?.length ? profile.allergies.join(", ") : "None reported"} />
                <Row label="Medical History" value={profile.medicalHistory?.length ? profile.medicalHistory.join(", ") : "None reported"} />
                <Row label="Smoking" value={profile.smoking ? "Yes" : "No"} />
                <Row label="Alcohol" value={profile.alcohol ? "Yes" : "No"} />
              </>
            ) : (
              <p style={styles.muted}>Profile data unavailable.</p>
            )}
          </Section>

          <Section title="B. TODAY'S HEALTH SNAPSHOT">
            {dashboard?.healthScore !== null && dashboard?.healthScore !== undefined ? (
              <>
                <Row label="Health Score" value={`${dashboard.healthScore} / 100`} />
                {dashboard.todayLog ? (
                  <>
                    <Row label="Weight" value={dashboard.todayLog.weight_kg ? `${dashboard.todayLog.weight_kg} kg` : null} />
                    <Row label="Steps" value={dashboard.todayLog.steps} />
                    <Row label="Sleep" value={dashboard.todayLog.sleepHours ? `${dashboard.todayLog.sleepHours} hrs` : null} />
                    <Row label="Water Intake" value={dashboard.todayLog.waterIntakeL ? `${dashboard.todayLog.waterIntakeL} L` : null} />
                    <Row label="Heart Rate" value={dashboard.todayLog.heartRate ? `${dashboard.todayLog.heartRate} bpm` : null} />
                    <Row
                      label="Blood Pressure"
                      value={dashboard.todayLog.bp_systolic ? `${dashboard.todayLog.bp_systolic}/${dashboard.todayLog.bp_diastolic} mmHg` : null}
                    />
                  </>
                ) : (
                  <p style={styles.muted}>No detailed log data for today.</p>
                )}
              </>
            ) : (
              <p style={styles.muted}>No data logged today.</p>
            )}
          </Section>

          <Section title="C. DISEASE RISK ASSESSMENT">
            {latestRisk ? (
              <>
                <Row label="Assessment" value="Diabetes Risk" />
                <Row label="Risk Level" value={latestRisk.riskLevel} />
                <Row label="Risk Percentage" value={`${latestRisk.riskPercentage}%`} />
                <Row
                  label="Top Factors"
                  value={latestRisk.importantFactors?.slice(0, 3).map((f) => f.factor).join(", ") || "—"}
                />
                <Row label="Date" value={latestRisk.createdAt ? new Date(latestRisk.createdAt).toLocaleDateString() : "—"} />
              </>
            ) : (
              <p style={styles.muted}>Not yet assessed.</p>
            )}
          </Section>

          <Section title="D. FITNESS PLAN SUMMARY">
            {fitnessPlan ? (
              <>
                <Row label="Goal" value={GOAL_LABELS[fitnessPlan.goal] || fitnessPlan.goal} />
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Day</th>
                      <th style={styles.th}>Focus</th>
                      <th style={styles.th}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fitnessPlan.weeklyPlan.map((d) => (
                      <tr key={d.day}>
                        <td style={styles.td}>{d.day}</td>
                        <td style={styles.td}>{d.focus}</td>
                        <td style={styles.td}>{d.durationMinutes} min</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p style={styles.muted}>Not yet generated.</p>
            )}
          </Section>

          <Section title="E. MEAL PLAN SUMMARY">
            {mealPlan ? (
              <>
                <Row label="Daily Calorie Target" value={`${mealPlan.dailyCalories} kcal`} />
                <Row
                  label="Macro Split"
                  value={`Protein ${mealPlan.macroSplit.protein}% / Carbs ${mealPlan.macroSplit.carbs}% / Fat ${mealPlan.macroSplit.fat}%`}
                />
                <Row label="Breakfast" value={mealPlan.meals.breakfast?.[0]} />
                <Row label="Lunch" value={mealPlan.meals.lunch?.[0]} />
                <Row label="Snack" value={mealPlan.meals.snack?.[0]} />
                <Row label="Dinner" value={mealPlan.meals.dinner?.[0]} />
              </>
            ) : (
              <p style={styles.muted}>Not yet generated.</p>
            )}
          </Section>

          <p style={styles.disclaimer}>
            This report is generated by HealthSense AI for informational purposes only and is not a substitute for
            professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider with
            any questions regarding a medical condition.
          </p>
        </div>
      </div>
    </div>
  );
}
