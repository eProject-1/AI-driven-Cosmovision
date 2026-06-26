import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Login from "../pages/Login";
import { useAuth } from "../context/AuthContext";


// Lovable-style pages (imported from new pages/lovable wrappers)
import LovableHome from "../pages/Home";
import LovablePlanets from "../pages/Planets";
import LovablePlanetDetail from "../pages/PlanetDetail";
import LovableConstellations from "../pages/Constellations";
import LovableObservatory from "../pages/Observatory";
import LovableNews from "../pages/News";
import LovableDashboard from "../pages/Dashboard";
import LovableAssistant from "../pages/Assistant";
import LovableProfile from "../pages/Profile";
import LovableRegister from "../pages/Register";

function RequireAuth({ children }) {
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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LovableHome />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<LovableRegister />} />
      <Route path="/planets" element={<LovablePlanets />} />
      <Route path="/planets/:slug" element={<LovablePlanetDetail />} />
      <Route path="/constellation" element={<LovableConstellations />} />
      <Route path="/constellations" element={<LovableConstellations />} />
      <Route path="/observatory" element={<LovableObservatory />} />
      <Route path="/news" element={<LovableNews />} />
      <Route path="/dashboard" element={<LovableDashboard />} />
      <Route path="/assistant" element={<LovableAssistant />} />
      <Route path="/profile" element={<RequireAuth><LovableProfile /></RequireAuth>} />
    </Routes>
  );
}
