import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authState";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-6 pt-40 text-center text-sm text-foreground/60">
        Checking your session...
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
