import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Planets from "../pages/Planets";
import Constellation from "../pages/Constellation";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/planets" element={<Planets />} />
      <Route path="/constellation" element={<Constellation />} />
    </Routes>
  );
}