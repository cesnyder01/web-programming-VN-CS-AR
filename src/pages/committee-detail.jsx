import React, { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function CommitteeDetail() {
  const { id } = useParams();
  const { appData, setAppData } = useAuth();

  const committees = appData.committees || [];
  const committee = committees.find((c) => String(c.id) === String(id));
  const currentUser = appData.auth?.currentUser || null;

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "standard",
  });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const motions = committee?.motions || [];
  const sortedMotions = useMemo(
    () =>
      [...motions].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
    [motions]
  );

  if (!committee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand p-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-cream/70 bg-white/80 p-8 text-center shadow-soft">
          <p className="text-lg font-semibold text-wine">Committee not found.</p>
          <Link to="/committees" className="btn-secondary mt-6">
            Back to committees
          </Link>
        </div>
      </div>
    );
  }

  function handleFormChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function createMotion(e) {
    e.preventDefault();
    setStatus("");
    const title = form.title.trim();
    const description = form.description.trim();
    if (!title) {
      setError("Motion title is required.");
      return;
    }
    const permissionKey = "createMotion";
    const normalizedCurrentName = currentUser?.name?.toLowerCase?.() || "";
    const memberRecord = (committee.members || []).find((member) => {
      if (!member) return false;
      if (member.userId && currentUser?.id) return member.userId === currentUser.id;
      if (member.email && currentUser?.email) {
        return member.email.toLowerCase() === currentUser.email.toLowerCase();
      }
      if (member.name && normalizedCurrentName) {
        return member.name.toLowerCase() === normalizedCurrentName;
      }
      return false;
    });
    const hasCreatePermission =
      !memberRecord || (memberRecord.permissions || []).includes(permissionKey);

    if (!hasCreatePermission) {
      setError("You do not have permission to raise motions in this committee.");
      return;
    }

    const newMotion = {
      id: safeId(),
      title,
      description,
      type: form.type,
      status: "pending",
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.id ?? null,
      createdByName: currentUser?.name ?? "Member",
    };

    const nextCommittees = committees.map((c) => {
      if (String(c.id) !== String(id)) return c;
      const nextMotions = [...(c.motions || []), newMotion];
      return { ...c, motions: nextMotions };
    });

    setAppData({ ...appData, committees: nextCommittees });
    setForm({ title: "", description: "", type: "standard" });
    setError("");
    setStatus("Motion submitted and awaiting discussion.");
  }

  function displayType(value) {
    switch (value) {
      case "procedure":
        return "Procedure change (2/3 vote)";
      case "special":
        return "Special motion";
      default:
        return "Standard motion (majority)";
    }
  }

  function formatTimestamp(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <Link
            to="/committees"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-semibold text-wine shadow-soft transition hover:-translate-y-0.5"
          >
            ← Back to committees
          </Link>
          <div className="card flex-1 border border-cream/80 bg-white/85 p-6 text-wine">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <span className="badge">Committee</span>
                <h1 className="mt-2 text-3xl font-bold">{committee.name}</h1>
              </div>
              <div className="flex gap-4 text-sm text-wine/80">
                <div className="rounded-2xl border border-cream/60 bg-white/70 px-4 py-2 text-center">
                  <p className="text-xs uppercase tracking-wide text-wine/60">Members</p>
                  <p className="text-lg font-semibold text-wine">{committee.members?.length || 0}</p>
                </div>
                <div className="rounded-2xl border border-cream/60 bg-white/70 px-4 py-2 text-center">
                  <p className="text-xs uppercase tracking-wide text-wine/60">Motions</p>
                  <p className="text-lg font-semibold text-wine">{committee.motions?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="card border border-cream/70 bg-white/90 p-6">
            <h2 className="text-lg font-semibold text-wine">Members & Roles</h2>
            <p className="mt-2 text-sm text-text/65">
              Ensure at least one owner and balance permissions for each voice.
            </p>
            <ul className="mt-6 space-y-3">
              {(committee.members || []).map((member, index) => (
                <li
                  key={`${member.id || member.name}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-cream/60 bg-peach/30 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-wine">{member.name}</p>
                    <p className="text-xs text-text/60">
                      Permissions: {(member.permissions || []).join(", ") || "—"}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                    {formatRole(member.role)}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card flex flex-col gap-8 border border-cream/70 bg-white/90 p-6">
            <div>
              <h2 className="text-lg font-semibold text-wine">Raise a Motion</h2>
              <p className="mt-1 text-sm text-text/65">
                Submit new business for consideration. Procedure changes need a two-thirds vote.
              </p>
              {error && (
                <p className="mt-4 rounded-2xl border border-rose/40 bg-rose/20 px-4 py-3 text-sm text-wine">
                  {error}
                </p>
              )}
              {status && (
                <p className="mt-4 rounded-2xl border border-peach/50 bg-peach/40 px-4 py-3 text-sm text-wine">
                  {status}
                </p>
              )}
            </div>
            <form className="space-y-6" onSubmit={createMotion}>
              <label className="block text-sm font-semibold text-wine" htmlFor="motionTitle">
                Motion title
                <input
                  id="motionTitle"
                  value={form.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Summarize the motion"
                  required
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="motionDescription">
                Description
                <textarea
                  id="motionDescription"
                  value={form.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="mt-2 min-h-[140px] w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                  placeholder="Provide details, amendments, or supporting context (optional)"
                />
              </label>

              <label className="block text-sm font-semibold text-wine" htmlFor="motionType">
                Motion type
                <select
                  id="motionType"
                  value={form.type}
                  onChange={(e) => handleFormChange("type", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                >
                  <option value="standard">Standard motion (majority)</option>
                  <option value="procedure">Procedure change (2/3 vote)</option>
                  <option value="special">Special motion</option>
                </select>
              </label>

              <button type="submit" className="btn-primary w-full justify-center">
                Submit motion
              </button>
            </form>
          </section>
        </div>

        <section className="card mt-10 border border-cream/70 bg-white/90 p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-wine">Motions log</h2>
              <p className="text-sm text-text/65">
                Track every proposal and return to previous business when needed.
              </p>
            </div>
          </div>

          {sortedMotions.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-cream/60 bg-peach/30 p-6 text-center text-sm text-text/70">
              No motions raised yet.
            </p>
          ) : (
            <ul className="mt-6 space-y-4">
              {sortedMotions.map((motion) => (
                <li
                  key={motion.id}
                  className="rounded-3xl border border-cream/60 bg-white/80 p-5 shadow-inner"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-wine">{motion.title}</h3>
                      <p className="text-sm text-text/65">{displayType(motion.type)}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                      {motion.status || "pending"}
                    </span>
                  </div>
                  {motion.description && (
                    <p className="mt-3 text-sm leading-relaxed text-text/75">{motion.description}</p>
                  )}
                  <p className="mt-4 text-xs text-text/60">
                    Proposed by {motion.createdByName || "Member"} • {formatTimestamp(motion.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );

  function formatRole(value) {
    return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
  }

  function safeId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
