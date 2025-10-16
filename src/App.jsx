import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import CommitteesList from "./pages/committee-list.jsx";
import CommitteeDetail from "./pages/committee-detail.jsx";
import CommitteeCreate from "./pages/committee-create.jsx";

function RequireAuth({ children }) {
  const { appData } = useAuth();
  return appData?.auth?.isLoggedIn ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<Navigate to="/committees" replace />} />
      <Route path="/committees" element={<RequireAuth><CommitteesList /></RequireAuth>} />
      <Route path="/committees/new" element={<RequireAuth><CommitteeCreate /></RequireAuth>} />
      <Route path="/committees/:id" element={<RequireAuth><CommitteeDetail /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

