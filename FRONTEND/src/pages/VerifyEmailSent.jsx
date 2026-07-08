import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { MailCheck, RefreshCw } from "lucide-react";
import { resendVerification } from "../services/auth.api";
import { useAuth } from "../context/authState";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailSent() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const initialEmail = location.state?.email || "";
  const [email, setEmail] = useState(initialEmail);
  const [message, setMessage] = useState(
    location.state?.fromLogin
      ? "This account still needs email verification."
      : "We sent a verification link to your inbox."
  );
  const [error, setError] = useState("");
  const [devLink, setDevLink] = useState(location.state?.verificationUrl || "");
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(
    location.state?.justRegistered ? RESEND_COOLDOWN_SECONDS : 0
  );

  const maskedEmail = useMemo(() => {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    const visible = name.slice(0, 2);
    return `${visible}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  if (!authLoading && user) return <Navigate to="/profile" replace />;

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email address first.");
      return;
    }

    setError("");
    setMessage("");
    setResending(true);

    try {
      const result = await resendVerification(email);
      setDevLink(result?.verificationUrl || "");
      setMessage("A new verification link has been sent.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const retryAfter = err.response?.data?.errors?.retryAfterSeconds;
      if (retryAfter) setCooldown(retryAfter);
      setError(err.response?.data?.message || err.message || "Could not resend verification email.");
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-stars" aria-hidden="true" />
      <section className="auth-shell">
        <Link to="/" className="auth-brand">
          <span>CV</span>
          CosmoVision
        </Link>

        <div className="auth-card">
          <div className="auth-header">
            <p>Email Confirmation</p>
            <h1>Check your email</h1>
            <span>
              {email ? `Open the link sent to ${maskedEmail} to activate your account.` : "Enter your email to resend the verification link."}
            </span>
          </div>

          <div className="demo-box">
            <strong className="inline-flex items-center gap-2">
              <MailCheck size={18} />
              Verification required
            </strong>
            <span>{message || "You can request another link when the timer finishes."}</span>
          </div>

          {devLink && (
            <div className="demo-box">
              <strong>Development link</strong>
              <a href={devLink}>{devLink}</a>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <div className="auth-form">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending || cooldown > 0}
              className="auth-submit inline-flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} className={resending ? "animate-spin" : ""} />
              {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending..." : "Resend email"}
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-400">
            Already verified?{" "}
            <Link to="/login" className="font-semibold text-cyan-200 hover:text-white">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
