import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Profile() {
  const { appData, updateProfile, logout } = useAuth();
  const user = appData.auth?.currentUser || {};

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name || "");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user.name || "");
  }, [user.name]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    try {
      setSaving(true);
      await updateProfile({ name: trimmed });
      setStatus("Display name updated.");
      setEditing(false);
    } catch (err) {
      setError(err.message || "Unable to update name.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand">
      <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            to="/committees"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-wine shadow-soft transition hover:-translate-y-0.5"
          >
            �+? Back to committees
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={logout} type="button" className="btn-secondary">
              Log out
            </button>
          </div>
        </div>

        <div className="mt-8 card border border-cream/80 bg-white/90 p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="badge">Profile</span>
              <h1 className="mt-3 text-3xl font-bold text-wine">Your account</h1>
              <p className="text-sm text-text/70">Manage your display name and identity.</p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setEditing((prev) => !prev)}
            >
              {editing ? "Cancel" : "Edit name"}
            </button>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-cream/70 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-wide text-text/60">Display name</p>
              <p className="mt-2 text-xl font-semibold text-wine">{user.name}</p>
            </div>
            <div className="rounded-2xl border border-cream/70 bg-white/80 p-5">
              <p className="text-xs uppercase tracking-wide text-text/60">Email</p>
              <p className="mt-2 text-xl font-semibold text-wine">{user.email}</p>
            </div>
          </div>

          {editing && (
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-wine">
                New display name
                <input
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-4 py-3 text-sm text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Enter the name to display"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              {error && <p className="text-sm text-rose">{error}</p>}
              {status && <p className="text-sm text-wine">{status}</p>}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button type="submit" className="btn-primary sm:w-auto" disabled={saving}>
                  {saving ? "Saving..." : "Save name"}
                </button>
                <button
                  type="button"
                  className="btn-secondary sm:w-auto"
                  onClick={() => {
                    setEditing(false);
                    setName(user.name || "");
                    setError("");
                    setStatus("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
