import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AuthField, AuthPanel, AuthSubmitButton, PasswordField } from "../components/auth/AuthPanel";
import { register } from "../services/auth.api";
import { useAuth } from "../context/authState";

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
      const result = await register(form.name, form.email, form.password);
      navigate("/verify-email-sent", {
        replace: true,
        state: {
          email: form.email,
          verificationUrl: result?.verificationUrl,
          verificationEmailSent: result?.verificationEmailSent,
          justRegistered: true,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPanel
      eyebrow="New explorer"
      title="Register"
      description="Create an account, then verify your email before signing in."
      error={error}
      footer={
        <p>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cyan-200 hover:text-white">
            Login
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
        <AuthField
          label="Display name"
          value={form.name}
          onChange={(name) => setForm((current) => ({ ...current, name }))}
          placeholder="Your name"
          minLength={2}
          maxLength={50}
        />

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
          placeholder="At least 8 characters"
          minLength={8}
        />

        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showPass}
          onToggle={() => setShowPass((value) => !value)}
          placeholder="Repeat your password"
          minLength={8}
        />

        <AuthSubmitButton
          icon={<UserPlus className="h-4 w-4" />}
          loading={loading}
          loadingText="Creating account..."
          disabled={authLoading}
        >
          Create account
        </AuthSubmitButton>
      </form>
    </AuthPanel>
  );
}
