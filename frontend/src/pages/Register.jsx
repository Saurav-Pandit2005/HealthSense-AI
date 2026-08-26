import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState } from "../components/ui/States";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    if (confirmPassword !== password) errs.confirmPassword = "Passwords don't match";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/profile-setup", { replace: true });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fadeUp">
        <div className="flex flex-col items-center mb-7">
          <div className="w-12 h-12 rounded-xl bg-brand-500 text-white flex items-center justify-center mb-3">
            <HeartPulse size={24} strokeWidth={2.3} />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
          <p className="text-sm text-muted mt-1">Start tracking your health with HealthSense AI</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-card border border-black/[0.04] p-7">
          <form onSubmit={handleSubmit} noValidate>
            <Field label="Full name" htmlFor="name" error={errors.name} required>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <TextInput id="name" placeholder="Saurav Pandit" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} className="pl-9" />
              </div>
            </Field>

            <Field label="Email" htmlFor="email" error={errors.email} required>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <TextInput id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} className="pl-9" />
              </div>
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password} required hint={!errors.password ? "At least 6 characters" : undefined}>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <TextInput id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} className="pl-9" />
              </div>
            </Field>

            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <TextInput
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  className="pl-9"
                />
              </div>
            </Field>

            {apiError && (
              <div className="mb-4">
                <ErrorState message={apiError} />
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-5">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-500 font-semibold hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
