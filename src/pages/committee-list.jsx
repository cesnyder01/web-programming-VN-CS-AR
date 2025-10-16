import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function CommitteesList() {
  const { appData, logout } = useAuth();
  const committees = appData.committees || [];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Committees</h1>
        <button onClick={logout} className="underline text-sm">Log out</button>
      </div>
      <div className="mt-4">
        <Link to="/committees/new" className="btn-outline">New Committee</Link>
      </div>
      <ul className="mt-4 space-y-2">
        {committees.length === 0 ? (
          <li className="text-sm text-gray-600">No committees yet.</li>
        ) : (
          committees.map((c) => (
            <li key={c.id}>
              <Link to={`/committees/${c.id}`} className="underline">{c.name}</Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

