import { Routes, Route, Navigate } from "react-router-dom";
import CommitteeCreate from "./pages/CommitteeCreate";
import CommitteesList from "./pages/CommitteesList";
import CommitteeDetail from "./pages/CommitteeDetail";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/committees" replace />} />
      <Route path="/committees" element={<CommitteesList />} />
      <Route path="/committees/new" element={<CommitteeCreate />} />
      <Route path="/committees/:id" element={<CommitteeDetail />} />
    </Routes>
  );
}
