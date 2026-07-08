import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../services/auth.api";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    let active = true;

    verifyEmail(token)
      .then(() => {
        if (!active) return;
        setStatus("success");
        setMessage("Your email has been verified.");
        window.setTimeout(() => {
          if (active) navigate("/login", { replace: true, state: { verified: true } });
        }, 1800);
      })
      .catch((err) => {
        if (!active) return;
        setStatus("error");
        setMessage(err.response?.data?.message || err.message || "Verification failed.");
      });

    return () => {
      active = false;
    };
  }, [navigate, token]);

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
            <p>Email Verification</p>
            <h1>{status === "success" ? "Verified" : status === "error" ? "Not verified" : "Verifying"}</h1>
            <span>{message}</span>
          </div>

          {status === "success" && (
            <Link to="/login" className="auth-submit text-center">
              Continue to login
            </Link>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="auth-error">{message}</div>
              <Link to="/login" className="auth-submit text-center">
                Back to login
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
