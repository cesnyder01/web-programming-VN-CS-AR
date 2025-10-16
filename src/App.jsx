// ===============================
// src/utils/storage.js
// ===============================
export const STORAGE_KEY = "appData";

export function loadAppData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  // seed with your sample data once
  const seed = {
    users: [
      { id: 1, name: "Alice", email: "alice@example.com", password: "1234" },
      { id: 2, name: "Vedha", email: "vedha@example.com", password: "abcd" }
    ],
    auth: { isLoggedIn: false, currentUser: null },
    committees: [
      {
        id: 1,
        name: "Sustainability Committee",
        members: [
          { name: "Alice", role: "Chair", permissions: ["createMotion", "vote", "discussion"] },
          { name: "Vedha", role: "Member", permissions: ["discussion", "vote"] }
        ],
        motions: []
      }
    ]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// ===============================
// src/context/AuthContext.jsx
// ===============================
import React, { createContext, useContext, useMemo, useState } from "react";
import { loadAppData, saveAppData } from "../utils/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [appData, setAppData] = useState(() => loadAppData());

  function persist(next) {
    setAppData(next);
    saveAppData(next);
  }

  const login = (email, password) => {
    const user = appData.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error("Invalid email or password.");
    const next = { ...appData, auth: { isLoggedIn: true, currentUser: user } };
    persist(next);
    return user;
  };

  const register = (name, email, password) => {
    if (appData.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered.");
    }
    const newUser = { id: Date.now(), name, email, password };
    const nextUsers = [...appData.users, newUser];
    const next = { ...appData, users: nextUsers, auth: { isLoggedIn: true, currentUser: newUser } };
    persist(next);
    return newUser;
  };

  const logout = () => {
    const next = { ...appData, auth: { isLoggedIn: false, currentUser: null } };
    persist(next);
  };

  const value = useMemo(
    () => ({ appData, setAppData: persist, login, register, logout }),
    [appData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

// ===============================
// src/pages/Login.jsx
// ===============================
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      login(email.trim(), password.trim());
      alert("Welcome back!");
      nav("/committees");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6">
        <h1 className="text-xl font-bold">Log in</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded-lg px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full border rounded-lg px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button className="w-full border rounded-lg px-3 py-2 bg-black text-white">Sign in</button>
        <p className="text-sm">No account? <Link to="/register" className="underline">Register</Link></p>
      </form>
    </div>
  );
}

// ===============================
// src/pages/Register.jsx
// ===============================
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const onSubmit = (e) => {
    e.preventDefault();
    setErr("");
    try {
      register(name.trim(), email.trim(), password.trim());
      alert("Account created successfully!");
      nav("/committees");
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 border rounded-xl p-6">
        <h1 className="text-xl font-bold">Register</h1>
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Email</label>
          <input className="w-full border rounded-lg px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">Password</label>
          <input type="password" className="w-full border rounded-lg px-3 py-2" value={password} onChange={(e)=>setPassword(e.target.value)} />
        </div>
        <button className="w-full border rounded-lg px-3 py-2 bg-black text-white">Create account</button>
        <p className="text-sm">Already have an account? <Link to="/login" className="underline">Log in</Link></p>
      </form>
    </div>
  );
}

// ===============================
// src/pages/CommitteesList.jsx (stub)
// ===============================
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CommitteesList() {
  const { appData, logout } = useAuth();
  const committees = appData.committees || [];
  const user = appData.auth.currentUser;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Committees</h1>
        <div className="text-sm flex items-center gap-3">
          <span>Hi, {user?.name}</span>
          <button className="border rounded px-2 py-1" onClick={logout}>Logout</button>
        </div>
      </div>

      <div className="mb-4">
        <Link to="/committees/new" className="inline-block border rounded px-3 py-2">+ Create Committee</Link>
      </div>

      {committees.length === 0 ? (
        <p className="text-gray-600">No committees yet.</p>
      ) : (
        <ul className="space-y-2">
          {committees.map((c) => (
            <li key={c.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-600">{c.members?.length || 0} members</div>
              </div>
              <Link to={`/committees/${c.id}`} className="underline text-sm">Open</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ===============================
// src/pages/CommitteeCreate.jsx (wire up the one you already have)
// ===============================
// Paste the CommitteeCreate.jsx from the other canvas here and replace the submit handler
// to also store into localStorage demo data (optional). Example below:

import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function CommitteeCreatePage() {
  const navigate = useNavigate();
  const { appData, setAppData } = useAuth();

  // Lazy import the component body (you already have it). Here is a tiny wrapper example:
  const onSuccess = (data) => {
    // For local demo without backend: push into localStorage structure
    const newCommittee = {
      id: Date.now(),
      name: data?.committeeName || data?.name || "New Committee",
      members: data?.members || [],
      motions: []
    };
    const next = { ...appData, committees: [...(appData.committees||[]), newCommittee] };
    setAppData(next);
    navigate(`/committees/${newCommittee.id}`);
  };

  return <div className="p-6">{/* Render your CommitteeCreate component here and pass onSuccess */}
    <p className="text-sm text-gray-600">Mount your CommitteeCreate form component here.</p>
  </div>;
}

// ===============================
// src/pages/CommitteeDetail.jsx (stub)
// ===============================
import React from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function CommitteeDetail() {
  const { id } = useParams();
  const { appData } = useAuth();
  const committee = (appData.committees || []).find((c) => String(c.id) === String(id));

  if (!committee) return (
    <div className="p-6">
      <p>Committee not found.</p>
      <Link to="/committees" className="underline">Back</Link>
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link to="/committees" className="underline text-sm">← Back</Link>
      <h1 className="text-2xl font-bold mt-2">{committee.name}</h1>
      <div className="mt-4">
        <h2 className="font-semibold mb-2">Members</h2>
        <ul className="list-disc ml-6">
          {(committee.members || []).map((m, i) => (
            <li key={i}>
              {m.name} — {m.role}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ===============================
// src/App.jsx
// ===============================
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CommitteesList from "./pages/CommitteesList";
import CommitteeDetail from "./pages/CommitteeDetail";
import { CommitteeCreatePage } from "./pages/CommitteeCreate";

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
      <Route path="/committees/new" element={<RequireAuth><CommitteeCreatePage /></RequireAuth>} />
      <Route path="/committees/:id" element={<RequireAuth><CommitteeDetail /></RequireAuth>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// ===============================
// src/main.jsx
// ===============================
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
