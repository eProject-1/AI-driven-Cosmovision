import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "user@cosmovision.app", password: "User@123" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!authLoading && user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate("/");
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
            <h1>Dang nhap</h1>
            <span>Kham pha vu tru cung AI va du lieu thien van hoc.</span>
          </div>

        
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
              Mat khau
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
              {loading ? "Dang dang nhap..." : "Dang nhap"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
