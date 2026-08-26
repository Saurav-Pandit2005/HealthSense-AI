import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Footprints, Moon, Droplets, HeartPulse, Weight, Target, ArrowRight } from "lucide-react";
import { dashboardApi, trackerApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Card, StatCard } from "../components/ui/Card";
import { LoadingState, ErrorState, EmptyState } from "../components/ui/States";
import { Button } from "../components/ui/Field";

const GOAL_LABELS = {
  lose_weight: "Lose Weight",
  gain_muscle: "Gain Muscle",
  maintain: "Maintain Weight",
  general_fitness: "General Fitness",
};

const FACTOR_LABELS = {
  steps: "Steps",
  sleep: "Sleep",
  hydration: "Hydration",
  exercise: "Exercise",
  heartRate: "Heart Rate",
  bloodPressure: "Blood Pressure",
  bmi: "BMI",
};

function scoreColor(score) {
  if (score === null || score === undefined) return "#5B6B82";
  if (score < 40) return "#DB4A28";
  if (score < 70) return "#CC8A1F";
  return "#17AB83";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([dashboardApi.summary(), trackerApi.history(14)])
      .then(([summaryData, historyData]) => {
        setSummary(summaryData);
        setHistory(historyData.logs || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-16">
        <LoadingState label="Loading your dashboard…" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  const { profile, todayLog, healthScore, healthScoreBreakdown } = summary;
  const chartData = history.map((h) => ({ date: h.date?.slice(5), weight: h.weight_kg, steps: h.steps }));

  return (
    <div className="space-y-6 animate-fadeUp">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-muted">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</p>
        </div>
        {profile.fitnessGoal && (
          <span className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-600 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Target size={13} /> Goal: {GOAL_LABELS[profile.fitnessGoal] || profile.fitnessGoal}
          </span>
        )}
      </div>

      {/* Health Score */}
      <Card>
        {healthScore === null ? (
          <EmptyState
            label="Log your health data today to see your health score."
            action={
              <Link to="/tracker">
                <Button variant="secondary">Go to Tracker</Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div
              className="w-36 h-36 rounded-full flex items-center justify-center relative shrink-0"
              style={{ background: `conic-gradient(${scoreColor(healthScore)} ${healthScore * 3.6}deg, #EEF2F6 0deg)` }}
            >
              <div className="w-28 h-28 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-bold text-ink">{healthScore}</span>
                <span className="text-[11px] text-muted">out of 100</span>
              </div>
            </div>
            <div className="flex-1 w-full">
              <p className="font-semibold text-ink mb-1">
                {healthScore >= 70 ? "Great work! 🎉" : healthScore >= 40 ? "Room to improve" : "Let's build some momentum"}
              </p>
              <p className="text-sm text-muted mb-4">
                Your score reflects today's steps, sleep, hydration, exercise, heart rate, blood pressure, and BMI.
              </p>
              {healthScoreBreakdown?.length > 0 && (
                <div className="space-y-2">
                  {healthScoreBreakdown.map((f) => (
                    <div key={f.factor} className="flex items-center gap-3">
                      <span className="text-xs text-muted w-24 shrink-0">{FACTOR_LABELS[f.factor] || f.factor}</span>
                      <div className="flex-1 h-2 rounded-full bg-black/[0.06] overflow-hidden">
                        <div className="h-full rounded-full bg-brand-400" style={{ width: `${f.score}%` }} />
                      </div>
                      <span className="text-xs font-mono text-ink w-8 text-right">{f.score}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="BMI" value={profile.bmi ?? "—"} sub={profile.bmiCategory} icon={Weight} tone="brand" />
        <StatCard label="Weight" value={todayLog?.weight_kg ?? "—"} unit="kg" icon={Weight} tone="brand" />
        <StatCard label="Steps" value={todayLog?.steps ?? "—"} icon={Footprints} tone="mint" />
        <StatCard label="Sleep" value={todayLog?.sleepHours ?? "—"} unit="hrs" icon={Moon} tone="brand" />
        <StatCard label="Water" value={todayLog?.waterIntakeL ?? "—"} unit="L" icon={Droplets} tone="mint" />
        <StatCard label="Heart Rate" value={todayLog?.heartRate ?? "—"} unit="bpm" icon={HeartPulse} tone="coral" />
      </div>

      {/* Trend chart */}
      <Card title="14-Day Trend" eyebrow="Progress">
        {chartData.length < 2 ? (
          <EmptyState label="Log at least 2 days of data in the Tracker to see your trend here." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EAF4F4" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5B6B82" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#5B6B82" }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#5B6B82" }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" name="Weight (kg)" stroke="#146C6C" strokeWidth={2} dot={false} connectNulls />
                <Line yAxisId="right" type="monotone" dataKey="steps" name="Steps" stroke="#22C99B" strokeWidth={2} dot={false} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Link to="/tracker">
          <Button variant="secondary">
            Update today's log <ArrowRight size={15} />
          </Button>
        </Link>
      </div>
    </div>
  );
}
