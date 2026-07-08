import { Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import Planets from "../pages/Planets";
import PlanetDetail from "../pages/PlanetDetail";
import PlanetFacts from "../pages/PlanetFacts";
import Constellations from "../pages/Constellations";
import ConstellationDetail from "../pages/ConstellationDetail";
import Observatory from "../pages/Observatory";
import ObservatoryDetail from "../pages/ObservatoryDetail";
import News from "../pages/News";
import Dashboard from "../pages/Dashboard";
import Assistant from "../pages/Assistant";
import Profile from "../pages/Profile";
import Register from "../pages/Register";
import VerifyEmail from "../pages/VerifyEmail";
import VerifyEmailSent from "../pages/VerifyEmailSent";
import { RequireAuth } from "./RequireAuth";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/planets" element={<Planets />} />
      <Route path="/planets/:slug/facts" element={<PlanetFacts />} />
      <Route path="/planets/:slug" element={<PlanetDetail />} />
      <Route path="/constellation" element={<Constellations />} />
      <Route path="/constellation/:slug" element={<ConstellationDetail />} />
      <Route path="/constellations" element={<Constellations />} />
      <Route path="/constellations/:slug" element={<ConstellationDetail />} />
      <Route path="/observatory" element={<Observatory />} />
      <Route path="/observatory/:slug" element={<ObservatoryDetail />} />
      <Route path="/news" element={<News />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/assistant" element={<Assistant />} />
      <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
    </Routes>
  );
}
