import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { authApi } from "../api/client";
import { LogoMark } from "../components/Logo";
import { Field, Button } from "../components/ui/Field";
import { ErrorState } from "../components/ui/States";
import PasswordInput from "../components/PasswordInput";
import PasswordChecklist from "../components/PasswordChecklist";
import ThemeToggle from "../components/ThemeToggle";
import { getPasswordError } from "../utils/passwordRules";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError(null);
    const errs = {};
    const pwError = getPasswordError(password);
    if (pwError) errs.password = pwError;
    if (confirm !== password) errs.confirm = "Passwords don't match";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setLoading(true);
    try {
      await authApi.resetPassword(token, { password });
      setDone(true);
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
        <div className="flex flex-col items-center mb-7 text-center">
          <LogoMark size={52} className="mb-3" />
          <h1 className="font-display text-2xl font-bold text-ink">{done ? "Password updated" : "Set a new password"}</h1>
          <p className="text-sm text-muted mt-1">{done ? "You can now log in with your new password." : "Choose a strong password you haven't used before."}</p>
        </div>

        <div className="bg-surface rounded-2xl shadow-card border border-line/[0.04] p-7">
          {done ? (
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-mint-50 text-mint-600 grid place-items-center mx-auto mb-4">
                <CheckCircle2 size={22} />
              </span>
              <Button type="button" className="w-full" onClick={() => navigate("/login", { replace: true })}>
                Go to login
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Field label="New password" htmlFor="password" error={errors.password} required>
                <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} autoComplete="new-password" />
              </Field>
              <PasswordChecklist password={password} />
              <Field label="Confirm new password" htmlFor="confirm" error={errors.confirm} required>
                <PasswordInput id="confirm" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} autoComplete="new-password" />
              </Field>
              {apiError && (
                <div className="mb-4">
                  <ErrorState message={apiError} />
                  <Link to="/forgot-password" className="mt-2 inline-block text-sm text-brand-500 font-semibold hover:underline">
                    Request a new link
                  </Link>
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full">
                Update password
              </Button>
            </form>
          )}
        </div>

        {!done && (
          <p className="text-center text-sm text-muted mt-5">
            <Link to="/login" className="text-brand-500 font-semibold hover:underline">
              Back to login
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
