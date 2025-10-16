import React from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

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
      <Link to="/committees" className="underline text-sm">↩ Back</Link>
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

