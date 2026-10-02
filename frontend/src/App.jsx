import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute, { RequireAuth } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import Tracker from "./pages/Tracker";
import DiseaseRisk from "./pages/DiseaseRisk";
import FitnessPlanner from "./pages/FitnessPlanner";
import MealPlanner from "./pages/MealPlanner";
import HealthReport from "./pages/HealthReport";
import Landing from "./pages/Landing";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          <Route element={<RequireAuth />}>
            <Route path="/profile-setup" element={<ProfileSetup />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tracker" element={<Tracker />} />
            <Route path="/disease-risk" element={<DiseaseRisk />} />
            <Route path="/fitness-planner" element={<FitnessPlanner />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
            <Route path="/health-report" element={<HealthReport />} />
          </Route>

          <Route path="/" element={<Landing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
