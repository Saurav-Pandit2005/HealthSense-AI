import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse, Mail, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState } from "../components/ui/States";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs = {};
    if (!email.trim()) errs.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
      const dest = location.state?.from?.pathname || "/dashboard";
      navigate(dest, { replace: true });
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
          <h1 className="font-display text-2xl font-bold text-ink">Welcome back</h1>
          <p className="text-sm text-muted mt-1">Log in to your HealthSense AI account</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-card border border-black/[0.04] p-7">
          <form onSubmit={handleSubmit} noValidate>
            <Field label="Email" htmlFor="email" error={errors.email} required>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <TextInput
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Password" htmlFor="password" error={errors.password} required>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <TextInput
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
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
              Log In
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted mt-5">
          Don't have an account?{" "}
          <Link to="/register" className="text-brand-500 font-semibold hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
