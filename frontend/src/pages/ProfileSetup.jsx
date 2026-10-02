import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, HeartPulse, Activity, Target, CheckCircle2, TrendingDown, Dumbbell, Scale, Zap, Cigarette, Wine } from "lucide-react";
import { profileApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Select, TagInput, Button } from "../components/ui/Field";
import { ErrorState, LoadingState } from "../components/ui/States";
import ThemeToggle from "../components/ThemeToggle";

const FITNESS_GOALS = [
  { value: "lose_weight", label: "Lose Weight", icon: TrendingDown },
  { value: "gain_muscle", label: "Gain Muscle", icon: Dumbbell },
  { value: "maintain", label: "Maintain Weight", icon: Scale },
  { value: "general_fitness", label: "General Fitness", icon: Zap },
];

function Section({ step, icon: Icon, title, subtitle, children }) {
  return (
    <section className="bg-surface rounded-2xl border border-line/[0.06] shadow-card p-5 flex flex-col">
      <header className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100 flex items-center justify-center shrink-0">
          <Icon size={18} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-[15px] font-bold text-ink leading-tight">{title}</h2>
          <p className="text-xs text-muted truncate">{subtitle}</p>
        </div>
        <span className="text-[11px] font-mono text-muted/70 tabular-nums shrink-0">{step} / 4</span>
      </header>
      <div className="flex-1">{children}</div>
    </section>
  );
}

function SwitchTile({ icon: Icon, label, checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus-ring ${
        checked ? "border-brand-400 bg-brand-50" : "border-line/10 hover:border-brand-300"
      }`}
    >
      <Icon size={18} className={checked ? "text-brand-600" : "text-muted"} />
      <span className="flex-1 text-sm font-medium text-ink">{label}</span>
      <span className={`relative w-10 h-6 rounded-full shrink-0 transition-colors ${checked ? "bg-brand-500" : "bg-line/15"}`}>
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function ProfileSetup() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();

  const [initializing, setInitializing] = useState(true);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [allergies, setAllergies] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [smoking, setSmoking] = useState(false);
  const [alcohol, setAlcohol] = useState(false);
  const [fitnessGoal, setFitnessGoal] = useState("");

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Pre-fill with any existing profile data (so users can edit, not just create)
  useEffect(() => {
    profileApi
      .get()
      .then((data) => {
        const p = data.profile;
        if (p.age) setAge(String(p.age));
        if (p.gender) setGender(p.gender);
        if (p.height_cm) setHeightCm(String(p.height_cm));
        if (p.weight_kg) setWeightKg(String(p.weight_kg));
        if (p.bloodGroup) setBloodGroup(p.bloodGroup);
        if (p.allergies) setAllergies(p.allergies);
        if (p.medicalHistory) setMedicalHistory(p.medicalHistory);
        if (p.smoking !== undefined) setSmoking(p.smoking);
        if (p.alcohol !== undefined) setAlcohol(p.alcohol);
        if (p.fitnessGoal) setFitnessGoal(p.fitnessGoal);
      })
      .catch(() => {})
      .finally(() => setInitializing(false));
  }, []);

  function validate() {
    const errs = {};
    const ageNum = Number(age);
    const heightNum = Number(heightCm);
    const weightNum = Number(weightKg);

    if (!age || ageNum < 1 || ageNum > 120) errs.age = "Age must be between 1 and 120";
    if (!gender) errs.gender = "Please select a gender";
    if (!heightCm || heightNum < 50 || heightNum > 260) errs.heightCm = "Height must be between 50 and 260 cm";
    if (!weightKg || weightNum < 2 || weightNum > 400) errs.weightKg = "Weight must be between 2 and 400 kg";
    if (!fitnessGoal) errs.fitnessGoal = "Please select a fitness goal";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await profileApi.update({
        age: Number(age),
        gender,
        height_cm: Number(heightCm),
        weight_kg: Number(weightKg),
        bloodGroup: bloodGroup || undefined,
        allergies,
        medicalHistory,
        smoking,
        alcohol,
        fitnessGoal,
      });
      updateUser({ profileCompleted: true });
      setSuccess(true);
      setTimeout(() => navigate("/dashboard", { replace: true }), 1400);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingState label="Loading your profile…" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center px-4">
        <div className="text-center animate-fadeUp">
          <div className="w-16 h-16 rounded-full bg-mint-50 text-mint-500 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} strokeWidth={2} />
          </div>
          <h2 className="font-display text-xl font-bold text-ink mb-1">Profile saved!</h2>
          <p className="text-sm text-muted">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas px-4 py-6 flex items-center">
      <ThemeToggle floating />
      <div className="w-full max-w-2xl lg:max-w-6xl mx-auto animate-fadeUp">
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center mx-auto mb-2">
            <UserRound size={20} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Complete Your Health Profile</h1>
          <p className="text-sm text-muted mt-1">This helps us personalize your dashboard, meal plans, and risk assessments.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Section step={1} icon={UserRound} title="Basic Info" subtitle="Tell us a bit about yourself">
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-x-3 -mb-4">
              <Field label="Age" htmlFor="age" error={errors.age} required>
                <TextInput id="age" type="number" placeholder="25" value={age} onChange={(e) => setAge(e.target.value)} error={errors.age} />
              </Field>
              <Field label="Gender" error={errors.gender} required>
                <Select value={gender} onChange={(e) => setGender(e.target.value)} error={errors.gender}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              <Field label="Height (cm)" htmlFor="height" error={errors.heightCm} required>
                <TextInput id="height" type="number" placeholder="175" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} error={errors.heightCm} />
              </Field>
              <Field label="Weight (kg)" htmlFor="weight" error={errors.weightKg} required>
                <TextInput id="weight" type="number" placeholder="70" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} error={errors.weightKg} />
              </Field>
              <Field
                label={
                  <>
                    Blood Group <span className="text-xs font-normal text-muted">(optional)</span>
                  </>
                }
              >
                <Select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)}>
                  <option value="">Not specified</option>
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Section>

          <Section step={2} icon={HeartPulse} title="Health Background" subtitle="Allergies and past conditions">
            <div className="-mb-4">
              <Field label="Allergies" hint="Type and press Enter to add">
                <TagInput tags={allergies} onChange={setAllergies} placeholder="e.g. Peanuts, Dust" />
              </Field>
              <Field label="Medical History" hint="Type and press Enter to add">
                <TagInput tags={medicalHistory} onChange={setMedicalHistory} placeholder="e.g. Asthma, Hypertension" />
              </Field>
            </div>
          </Section>

          <Section step={3} icon={Activity} title="Lifestyle" subtitle="Habits that affect your risk score">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <SwitchTile icon={Cigarette} label="I currently smoke" checked={smoking} onChange={setSmoking} />
              <SwitchTile icon={Wine} label="I drink alcohol" checked={alcohol} onChange={setAlcohol} />
            </div>
          </Section>

          <Section step={4} icon={Target} title="Fitness Goal" subtitle="What do you want to achieve?">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FITNESS_GOALS.map((g) => {
                const selected = fitnessGoal === g.value;
                return (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setFitnessGoal(g.value)}
                    aria-pressed={selected}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center text-[13px] leading-tight font-semibold transition-all focus-ring ${
                      selected ? "border-brand-500 bg-brand-50 text-brand-600" : "border-line/10 text-muted hover:border-brand-300 hover:text-ink"
                    }`}
                  >
                    <g.icon size={20} strokeWidth={2} />
                    {g.label}
                  </button>
                );
              })}
            </div>
            {errors.fitnessGoal && <p className="mt-3 text-xs text-coral-500 font-medium">{errors.fitnessGoal}</p>}
          </Section>

          {apiError && (
            <div className="lg:col-span-2">
              <ErrorState message={apiError} />
            </div>
          )}

          <div className="lg:col-span-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-muted">
              <span className="text-coral-500">*</span> Required fields
            </p>
            <Button type="submit" loading={loading} className="w-full sm:w-auto sm:min-w-[240px] !py-3">
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
