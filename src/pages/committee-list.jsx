import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function CommitteesList() {
  const { appData, logout } = useAuth();
  const committees = appData.committees || [];
  const currentUser = appData.auth?.currentUser;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <header className="flex flex-col gap-4 rounded-3xl border border-cream/70 bg-white/80 p-6 shadow-soft backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <span className="badge">Your workspace</span>
            <h1 className="mt-3 text-3xl font-bold text-wine">Committees</h1>
            <p className="text-sm text-text/70">
              {currentUser ? `Signed in as ${currentUser.name}.` : "Manage your committees."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/committees/new" className="btn-primary">
              New Committee
            </Link>
            <button
              onClick={logout}
              className="btn-secondary"
              type="button"
            >
              Log out
            </button>
          </div>
        </header>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {committees.length === 0 ? (
            <p className="card col-span-full border border-cream/80 bg-white/90 p-8 text-center text-text/70">
              No committees yet. Create one to get started.
            </p>
          ) : (
            committees.map((committee) => (
              <Link
                key={committee.id}
                to={`/committees/${committee.id}`}
                className="card flex h-full flex-col gap-4 border border-wine/10 bg-white/85 p-6 transition hover:-translate-y-1 hover:shadow-card"
              >
                <div>
                  <h2 className="text-xl font-semibold text-wine">{committee.name}</h2>
                  <p className="mt-1 text-sm text-text/70">
                    {committee.members?.length || 0} members • {committee.motions?.length || 0} motions
                  </p>
                </div>
                <div className="mt-auto flex items-center gap-2 text-sm text-wine">
                  <span className="font-semibold">View committee</span>
                  <span aria-hidden className="translate-y-[1px]">→</span>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
