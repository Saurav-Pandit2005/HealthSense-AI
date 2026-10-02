import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoMark } from "../components/Logo";
import { Mail, User } from "lucide-react";
import PasswordInput from "../components/PasswordInput";
import PasswordChecklist from "../components/PasswordChecklist";
import { getPasswordError } from "../utils/passwordRules";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState } from "../components/ui/States";
import ThemeToggle from "../components/ThemeToggle";

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
    const pwError = getPasswordError(password);
    if (pwError) errs.password = pwError;
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
      <ThemeToggle floating />
      <div className="w-full max-w-md animate-fadeUp">
        <div className="flex flex-col items-center mb-7">
          <LogoMark size={52} className="mb-3" />
          <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
          <p className="text-sm text-muted mt-1">Start tracking your health with HealthSense AI</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-card border border-line/[0.04] p-7">
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

            <Field label="Password" htmlFor="password" error={errors.password} required>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" />
            </Field>
            <PasswordChecklist password={password} />

            <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword} required>
              <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} error={errors.confirmPassword} autoComplete="new-password" />
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
