import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/login.jsx";
import Register from "./pages/register.jsx";
import CommitteesList from "./pages/committee-list.jsx";
import CommitteeDetail from "./pages/committee-detail.jsx";
import CommitteeCreate from "./pages/committee-create.jsx";
import Landing from "./pages/landing.jsx";

function RequireAuth({ children }) {
  const { appData } = useAuth();
  return appData?.auth?.isLoggedIn ? children : <Navigate to="/login" replace />;
}

function RedirectIfAuthed({ children }) {
  const { appData } = useAuth();
  return appData?.auth?.isLoggedIn ? <Navigate to="/committees" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <Login />
          </RedirectIfAuthed>
        }
      />
      <Route
        path="/register"
        element={
          <RedirectIfAuthed>
            <Register />
          </RedirectIfAuthed>
        }
      />
      <Route path="/committees" element={<RequireAuth><CommitteesList /></RequireAuth>} />
      <Route path="/committees/new" element={<RequireAuth><CommitteeCreate /></RequireAuth>} />
      <Route path="/committees/:id" element={<RequireAuth><CommitteeDetail /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
