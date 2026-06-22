import { Routes, Route } from "react-router-dom";
import Login from "../pages/Login";


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
      <Route path="/profile" element={<LovableProfile />} />
    </Routes>
  );
}