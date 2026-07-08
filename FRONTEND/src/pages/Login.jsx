import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { LogIn } from "lucide-react";
import { AuthField, AuthPanel, AuthSubmitButton, PasswordField } from "../components/auth/AuthPanel";
import { useAuth } from "../context/authState";

export default function Login() {
  const { login, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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
      const message = err.response?.data?.message || err.message || "Login failed. Please try again.";
      if (err.response?.status === 403 && message.toLowerCase().includes("verify")) {
        navigate("/verify-email-sent", {
          state: { email: form.email, fromLogin: true },
        });
        return;
      }

      setError(err.response?.data?.message || err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      eyebrow="Welcome back"
      title="Login"
      description="Sign in to chat with NOVA and open your explorer profile."
      notice={
        location.state?.verified || searchParams.get("verified") === "1"
          ? "Email verified. You can now log in."
          : ""
      }
      error={searchParams.get("verified") === "0" ? "Verification link is invalid or expired." : error}
      footer={
        <p>
          New here?{" "}
          <Link to="/register" className="font-semibold text-cyan-200 hover:text-white">
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <AuthField
          label="Email"
          type="email"
          value={form.email}
          onChange={(email) => setForm((current) => ({ ...current, email }))}
          placeholder="you@example.com"
        />

        <PasswordField
          value={form.password}
          onChange={(password) => setForm((current) => ({ ...current, password }))}
          visible={showPass}
          onToggle={() => setShowPass((value) => !value)}
          placeholder="Enter your password"
        />

        <AuthSubmitButton
          icon={<LogIn className="h-4 w-4" />}
          loading={loading}
          loadingText="Signing in..."
          disabled={authLoading}
        >
          Login
        </AuthSubmitButton>
      </form>
    </AuthPanel>
  );
}
