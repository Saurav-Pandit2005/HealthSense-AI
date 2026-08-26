import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, HeartPulse, Activity, Target, CheckCircle2 } from "lucide-react";
import { profileApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Select, TagInput, Toggle, Button } from "../components/ui/Field";
import { Card } from "../components/ui/Card";
import { ErrorState, LoadingState } from "../components/ui/States";

const FITNESS_GOALS = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "gain_muscle", label: "Gain Muscle" },
  { value: "maintain", label: "Maintain Weight" },
  { value: "general_fitness", label: "General Fitness" },
];

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
    <div className="min-h-screen bg-canvas px-4 py-10">
      <div className="max-w-2xl mx-auto animate-fadeUp">
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center mx-auto mb-3">
            <UserRound size={22} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Complete Your Health Profile</h1>
          <p className="text-sm text-muted mt-1">This helps us personalize your dashboard, meal plans, and risk assessments.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <Card title="Basic Info" eyebrow="Step 1" icon={UserRound}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
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
              <Field label="Blood Group" hint="Optional">
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
          </Card>

          <Card title="Health Background" eyebrow="Step 2" icon={HeartPulse}>
            <Field label="Allergies" hint="Type and press Enter to add">
              <TagInput tags={allergies} onChange={setAllergies} placeholder="e.g. Peanuts, Dust" />
            </Field>
            <Field label="Medical History" hint="Type and press Enter to add">
              <TagInput tags={medicalHistory} onChange={setMedicalHistory} placeholder="e.g. Asthma, Hypertension" />
            </Field>
          </Card>

          <Card title="Lifestyle" eyebrow="Step 3" icon={Activity}>
            <div className="flex flex-wrap gap-6">
              <Toggle checked={smoking} onChange={setSmoking} label="I currently smoke" />
              <Toggle checked={alcohol} onChange={setAlcohol} label="I drink alcohol" />
            </div>
          </Card>

          <Card title="Fitness Goal" eyebrow="Step 4" icon={Target}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {FITNESS_GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setFitnessGoal(g.value)}
                  className={`rounded-xl border-2 px-3 py-4 text-center text-sm font-semibold transition-all focus-ring ${
                    fitnessGoal === g.value ? "border-brand-500 bg-brand-50 text-brand-600" : "border-black/10 text-muted hover:border-brand-200"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            {errors.fitnessGoal && <p className="mt-3 text-xs text-coral-500 font-medium">{errors.fitnessGoal}</p>}
          </Card>

          {apiError && <ErrorState message={apiError} />}

          <Button type="submit" loading={loading} className="w-full !py-3">
            Save Profile
          </Button>
        </form>
      </div>
    </div>
  );
}
