import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, MailCheck, ArrowLeft } from "lucide-react";
import { authApi } from "../api/client";
import { LogoMark } from "../components/Logo";
import { Field, TextInput, Button } from "../components/ui/Field";
import { ErrorState } from "../components/ui/States";
import ThemeToggle from "../components/ThemeToggle";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
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
          <h1 className="font-display text-2xl font-bold text-ink">{sent ? "Check your email" : "Forgot your password?"}</h1>
          <p className="text-sm text-muted mt-1 max-w-[36ch]">
            {sent ? `If an account exists for ${email}, we've sent a link to reset your password. It expires in 30 minutes.` : "Enter your email and we'll send you a link to set a new password."}
          </p>
        </div>

        <div className="bg-surface rounded-2xl shadow-card border border-line/[0.04] p-7">
          {sent ? (
            <div className="text-center">
              <span className="w-12 h-12 rounded-full bg-mint-50 text-mint-600 grid place-items-center mx-auto mb-4">
                <MailCheck size={22} />
              </span>
              <p className="text-sm text-muted mb-5">Didn't get it? Check your spam folder, or try again.</p>
              <Button type="button" variant="outline" className="w-full" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Email" htmlFor="email" required>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <TextInput id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </Field>
              {error && (
                <div className="mb-4">
                  <ErrorState message={error} />
                </div>
              )}
              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm mt-5">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-brand-500 font-semibold hover:underline">
            <ArrowLeft size={14} /> Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
