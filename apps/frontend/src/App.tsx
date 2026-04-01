import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import RecordPage from "./pages/RecordPage";
import ReportPage from "./pages/ReportPage";
import ManagerListPage from "./pages/ManagerListPage";
import ManagerDetailPage from "./pages/ManagerDetailPage";
import FeedbackPage from "./pages/FeedbackPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import MyReportsPage from "./pages/MyReportsPage";
import AdminUsersPage from "./pages/AdminUsersPage";

export default function App() {
  return (
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Worker routes */}
          <Route path="/" element={
            <ProtectedRoute><RoleRoute role="worker"><RecordPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute><RoleRoute role="worker"><ReportPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/my-reports" element={
            <ProtectedRoute><RoleRoute role="worker"><MyReportsPage /></RoleRoute></ProtectedRoute>
          } />

          {/* Manager routes */}
          <Route path="/manager" element={
            <ProtectedRoute><RoleRoute role="manager"><ManagerListPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/manager/:id" element={
            <ProtectedRoute><RoleRoute role="manager"><ManagerDetailPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/feedback" element={
            <ProtectedRoute><RoleRoute role="manager"><FeedbackPage /></RoleRoute></ProtectedRoute>
          } />
          <Route path="/admin/users" element={
            <ProtectedRoute><RoleRoute role="manager"><AdminUsersPage /></RoleRoute></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}
