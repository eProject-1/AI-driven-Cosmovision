import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { register } from "../services/auth.api";
import { useAuth } from "../context/AuthContext";

export default function LovableRegister() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) return <Navigate to="/profile" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (form.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
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
            <p>New Explorer</p>
            <h1>Register</h1>
            <span>Create an account to unlock NOVA chat and your user profile.</span>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Display name
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                minLength={2}
                maxLength={50}
                required
              />
            </label>

            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <div className="password-field">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="At least 8 characters"
                  minLength={8}
                  required
                />
                <button type="button" onClick={() => setShowPass((value) => !value)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <label>
              Confirm password
              <input
                type={showPass ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                minLength={8}
                required
              />
            </label>

            <button type="submit" disabled={loading || authLoading} className="auth-submit">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cyan-200 hover:text-white">
              Login
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
