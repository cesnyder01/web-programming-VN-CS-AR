import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../utils/api.js";

const defaultPermissions = ["createMotion", "discussion", "moveToVote", "vote"];

function cap(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function safeId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function CommitteeCreate() {
  const navigate = useNavigate();
  const { refreshCommittees, appData } = useAuth();
  const currentUser = appData.auth?.currentUser;

  const [committeeName, setCommitteeName] = useState("");
  const [members, setMembers] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [recordNamesInVotes, setRecordNamesInVotes] = useState(false);

  const ownerCount = useMemo(
    () => members.filter((m) => m.role === "owner").length,
    [members]
  );

  const editingMember = members.find((m) => m.id === editingId) || null;

  useEffect(() => {
    if (!currentUser?.email) return;
    setMembers((prev) => {
      const exists = prev.some(
        (member) => member.email?.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (exists) return prev;
      return [
        {
          id: safeId(),
          name: currentUser.name || "Owner",
          email: currentUser.email,
          role: "owner",
          permissions: [...defaultPermissions],
        },
        ...prev,
      ];
    });
  }, [currentUser]);

  function addMember(member) {
    const name = member.name?.trim();
    const email = member.email?.trim();
    const role = member.role;
    const permissions = member.permissions?.length
      ? [...member.permissions]
      : [...defaultPermissions];

    if (!name || !email || !role) {
      alert("Please provide a name, email, and role for each member.");
      return;
    }
    if (role === "owner" && ownerCount >= 1) {
      alert("There can be only one Owner. Update the existing Owner first.");
      return;
    }

    setMembers((prev) => [
      ...prev,
      { id: safeId(), name, email, role, permissions },
    ]);
  }

  function startEdit(id) {
    setEditingId(id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(member) {
    const name = member.name?.trim();
    const email = member.email?.trim();
    const role = member.role;
    const permissions = member.permissions?.length
      ? [...member.permissions]
      : [...defaultPermissions];

    if (!member.id) return;
    if (!name || !email || !role) {
      alert("Please provide a name, email, and role.");
      return;
    }

    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === member.id);
      if (idx === -1) return prev;

      const wasOwner = prev[idx].role === "owner";
      const willBeOwner = role === "owner";
      const existingOwnerCount = prev.filter((m) => m.role === "owner").length;

      if (willBeOwner && !wasOwner && existingOwnerCount >= 1) {
        alert("There can be only one Owner. Update the existing Owner first.");
        return prev;
      }
      if (!willBeOwner && wasOwner && existingOwnerCount === 1) {
        alert("You must have exactly one Owner. Assign a new Owner before changing this role.");
        return prev;
      }

      const next = [...prev];
      next[idx] = { ...next[idx], name, role, permissions };
      return next;
    });
    setEditingId(null);
  }

  function removeMember(id) {
    setMembers((prev) => {
      const target = prev.find((m) => m.id === id);
      const remaining = prev.filter((m) => m.id !== id);
      if (target?.role === "owner") {
        const stillHasOwner = remaining.some((m) => m.role === "owner");
        if (!stillHasOwner) {
          alert("You must have exactly one Owner. Assign a new Owner before removing this one.");
          return prev;
        }
      }
      return remaining;
    });
    if (editingId === id) setEditingId(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = committeeName.trim();
    if (!name) {
      alert("Please enter a committee name.");
      return;
    }
    if (members.length === 0) {
      alert("Please add at least one member (and exactly one Owner).");
      return;
    }
    if (ownerCount !== 1) {
      alert("You must have exactly one Owner.");
      return;
    }

  const settings = {
    offlineMode: true,
    minSpeakersBeforeVote: 2,
    recordNamesInVotes,
    allowSpecialMotions: true,
  };

    const payload = {
      name,
      members,
      settings,
    };

    try {
      const { committee: created } = await api.createCommittee(payload);
      await refreshCommittees();
      setCommitteeName("");
      setMembers([]);
      setEditingId(null);
      navigate(`/committees/${created._id || created.id}`);
    } catch (err) {
      alert(err.message || "Unable to create committee.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream via-peach to-sand">
      <div className="mx-auto max-w-6xl px-6 py-10 md:px-10">
        <form onSubmit={handleSubmit} className="space-y-10">
          <header className="card border border-cream/80 bg-white/90 p-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="badge">Committee Builder</span>
                <h1 className="mt-2 text-3xl font-bold text-wine">Create a committee</h1>
                <p className="text-sm text-text/65">
                  Name your group, assign one owner, and tailor permissions for every member.
                </p>
              </div>
              <div className="rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-sm text-text/70">
                <p className="font-semibold text-wine">Tip</p>
                <p>Exactly one member must hold the Owner role to manage chair settings.</p>
              </div>
            </div>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
            <section className="card border border-cream/70 bg-white/90 p-6">
          <div>
            <label htmlFor="committeeName" className="block text-sm font-semibold text-wine">
              Committee name
                  <input
                    id="committeeName"
                    type="text"
                    value={committeeName}
                    onChange={(e) => setCommitteeName(e.target.value)}
                    placeholder="e.g. Sustainability Task Force"
                    className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
                    required
                  />
                </label>
              </div>

              <div className="mt-8">
                <h2 className="text-lg font-semibold text-wine">Add / edit member</h2>
                <p className="text-sm text-text/65">
                  Owners manage settings, chairs moderate meetings, members participate, and observers follow along.
                </p>
                <MemberForm
                  key={editingMember?.id || "new-member"}
                  initial={editingMember || undefined}
                  onAdd={addMember}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                />
              </div>
            </section>

            <section className="card border border-cream/70 bg-white/90 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-wine">Members</h2>
                <span className="rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                  {members.length} total
                </span>
              </div>
              <p className="mt-2 text-sm text-text/65">
                Tip: Ensure exactly one Owner is assigned before saving the committee.
              </p>
              <MembersTable members={members} onEdit={startEdit} onRemove={removeMember} />
            </section>
          </div>

          <section className="card border border-cream/70 bg-white/90 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-wine">Meeting preferences</h2>
              <span className="rounded-full bg-rose/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose">
                Host only
              </span>
            </div>
            <p className="mt-2 text-sm text-text/65">
              Choose vote privacy before the meeting starts. You can switch to named votes to show who cast each ballot.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-cream/70 bg-white/80 p-4 text-sm text-text/80 shadow-inner">
                <input
                  type="radio"
                  name="vote-privacy"
                  className="mt-[2px] h-4 w-4 text-wine focus:ring-rose/40"
                  checked={!recordNamesInVotes}
                  onChange={() => setRecordNamesInVotes(false)}
                />
                <div>
                  <p className="font-semibold text-wine">Anonymous voting</p>
                  <p className="text-xs text-text/60">Tallies only; voter names stay hidden for everyone.</p>
                </div>
              </label>
              <label className="flex cursor-pointer gap-3 rounded-2xl border border-cream/70 bg-white/80 p-4 text-sm text-text/80 shadow-inner">
                <input
                  type="radio"
                  name="vote-privacy"
                  className="mt-[2px] h-4 w-4 text-wine focus:ring-rose/40"
                  checked={recordNamesInVotes}
                  onChange={() => setRecordNamesInVotes(true)}
                />
                <div>
                  <p className="font-semibold text-wine">Show voter names</p>
                  <p className="text-xs text-text/60">Vote records include member names and are visible to the committee.</p>
                </div>
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" className="btn-primary px-10">
              Save committee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberForm({ initial, onAdd, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [role, setRole] = useState(initial?.role || "");
  const [permissions, setPermissions] = useState(
    initial?.permissions?.length ? [...initial.permissions] : [...defaultPermissions]
  );

  const isEditing = Boolean(initial?.id);

  function togglePermission(permission) {
    setPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission]
    );
  }

  function handleSubmit() {
    const nextMember = {
      id: initial?.id,
      name,
      email: email?.trim(),
      role,
      permissions: [...permissions],
    };
    if (isEditing) onSave(nextMember);
    else {
      onAdd(nextMember);
      setName("");
      setEmail("");
      setRole("");
      setPermissions([...defaultPermissions]);
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-wine" htmlFor="member-name">
          Name
          <input
            id="member-name"
            type="text"
            className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Member name"
          />
        </label>

        <label className="block text-sm font-semibold text-wine" htmlFor="member-email">
          Email
          <input
            id="member-email"
            type="email"
            className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/70 px-4 py-3 text-base text-text placeholder:text-text/40 shadow-inner focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="member@example.com"
          />
        </label>

        <label className="block text-sm font-semibold text-wine" htmlFor="member-role">
          Role
          <select
            id="member-role"
            className="mt-2 w-full rounded-2xl border border-cream/70 bg-white/80 px-4 py-3 text-base text-text focus:border-wine focus:outline-none focus:ring-2 focus:ring-rose/40"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="" disabled>
              Select a role
            </option>
            <option value="owner">Owner</option>
            <option value="chair">Chair</option>
            <option value="member">Member</option>
            <option value="observer">Observer</option>
          </select>
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-wine">Permissions</p>
        <p className="text-xs text-text/60">
          Choose actions this member can perform during meetings.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {[
            { key: "createMotion", label: "Create Motion" },
            { key: "discussion", label: "Discussion" },
            { key: "moveToVote", label: "Move to Vote" },
            { key: "vote", label: "Vote" },
          ].map((perm) => {
            const checked = permissions.includes(perm.key);
            return (
              <label
                key={perm.key}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                  checked
                    ? "border-wine bg-wine/10 text-wine"
                    : "border-cream/80 bg-white/70 text-text/70 hover:border-rose/50 hover:text-wine"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => togglePermission(perm.key)}
                  className="accent-wine"
                />
                <span>{perm.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={handleSubmit} className="btn-primary">
          {isEditing ? "Save changes" : "Add member"}
        </button>
        {isEditing && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function MembersTable({ members, onEdit, onRemove }) {
  if (!members.length) {
    return (
      <div className="mt-6 rounded-2xl border border-cream/70 bg-peach/30 p-6 text-sm text-text/70">
        No members added yet. Add at least one owner to continue.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex flex-col gap-4 rounded-2xl border border-cream/70 bg-white/80 p-5 shadow-inner md:flex-row md:items-center md:justify-between"
        >
          <div>
            <p className="text-base font-semibold text-wine">{member.name}</p>
            {member.email && (
              <p className="text-xs text-text/60">{member.email}</p>
            )}
            <p className="text-xs uppercase tracking-wide text-text/50">
              Role • {cap(member.role)}
            </p>
            <p className="mt-2 text-sm text-text/70">
              Permissions: {member.permissions?.length ? member.permissions.join(", ") : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onEdit(member.id)} className="btn-secondary">
              Edit
            </button>
            <button
              type="button"
              onClick={() => onRemove(member.id)}
              className="inline-flex items-center justify-center rounded-full border border-rose/50 bg-rose/20 px-4 py-2 text-sm font-semibold text-rose transition hover:bg-rose/30"
            >
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
