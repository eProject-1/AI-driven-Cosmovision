import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) return <Navigate to="/profile" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/profile");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
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
            <p>Welcome Back</p>
            <h1>Login</h1>
            <span>Sign in to chat with NOVA and open your explorer profile.</span>
          </div>

          {location.state?.registered && (
            <div className="demo-box">
              <strong>Account created</strong>
              <span>Please log in with your new account.</span>
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
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
                  placeholder="Enter your password"
                  required
                />
                <button type="button" onClick={() => setShowPass((value) => !value)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            <button type="submit" disabled={loading || authLoading} className="auth-submit">
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-400">
            New here?{" "}
            <Link to="/register" className="font-semibold text-cyan-200 hover:text-white">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
