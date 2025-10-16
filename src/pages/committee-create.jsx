// src/pages/CommitteeCreate.jsx
import React, { useMemo, useState } from "react";

export default function CommitteeCreate() {
  const [committeeName, setCommitteeName] = useState("");
  const [members, setMembers] = useState([]); // {id,name,role,permissions:[]}
  const [editingId, setEditingId] = useState(null);
  const ownerCount = useMemo(
    () => members.filter((m) => m.role === "owner").length,
    [members]
  );
  const editingMember = members.find((m) => m.id === editingId) || null;

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  function addMember({ name, role, permissions }) {
    if (!name || !role) return alert("Please provide a name and select a role.");
    if (role === "owner" && ownerCount >= 1) {
      return alert("There can be only one Owner. Change the existing Owner first.");
    }
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, role, permissions },
    ]);
  }

  function startEdit(id) {
    setEditingId(id);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function saveEdit(updated) {
    if (!updated.name || !updated.role)
      return alert("Please provide a name and select a role.");

    setMembers((prev) => {
      const idx = prev.findIndex((m) => m.id === updated.id);
      if (idx === -1) return prev;

      const wasOwner = prev[idx].role === "owner";
      const willBeOwner = updated.role === "owner";
      const currentOwnerCount = prev.filter((m) => m.role === "owner").length;

      if (willBeOwner && !wasOwner && currentOwnerCount >= 1) {
        alert("There can be only one Owner. Change the existing Owner first.");
        return prev;
      }
      if (!willBeOwner && wasOwner && currentOwnerCount === 1) {
        alert("You must have exactly one Owner. Assign another Owner first.");
        return prev;
      }

      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
    setEditingId(null);
  }

  function removeMember(id) {
    setMembers((prev) => {
      const target = prev.find((m) => m.id === id);
      const next = prev.filter((m) => m.id !== id);
      if (target?.role === "owner") {
        const stillHasOwner = next.some((m) => m.role === "owner");
        if (!stillHasOwner) {
          alert("You must have exactly one Owner. Assign a new Owner first.");
          return prev;
        }
      }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const name = committeeName.trim();
    if (!name) return alert("Please enter a committee name.");
    if (members.length === 0)
      return alert("Please add at least one member (and exactly one Owner).");
    if (ownerCount !== 1) return alert("You must have exactly one Owner.");

    const payload = {
      committeeName: name,
      members,
      // default settings (remove if your backend sets these)
      settings: {
        offlineMode: true,
        minSpeakersBeforeVote: 2,
        recordNamesInVotes: false,
        allowSpecialMotions: true,
      },
    };

    try {
      const resp = await fetch("/create-committee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(await resp.text());
      await resp.json().catch(() => ({}));
      alert("Committee created successfully!");
      setCommitteeName("");
      setMembers([]);
    } catch (err) {
      console.error(err);
      alert("Failed to create committee: " + (err?.message || String(err)));
    }
  }

  return (
    <div className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-3xl p-6">
        <h1 className="text-2xl font-bold mb-6">Create a Committee</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Committee Name */}
          <div>
            <label htmlFor="committeeName" className="block text-sm font-medium mb-1">
              Committee Name
            </label>
            <input
              id="committeeName"
              type="text"
              value={committeeName}
              onChange={(e) => setCommitteeName(e.target.value)}
              placeholder="Enter a committee name"
              className="w-full border rounded-lg px-3 py-2"
              required
            />
          </div>

          {/* Add / Edit Member */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Add / Edit Member</h2>
            <MemberForm
              key={editingMember?.id || "new"}
              initial={editingMember || undefined}
              onAdd={addMember}
              onSave={saveEdit}
              onCancel={cancelEdit}
            />
          </div>

          {/* Members List */}
          <div>
            <h2 className="text-xl font-semibold mb-3">Members</h2>
            <MembersTable
              members={members}
              cap={cap}
              onEdit={startEdit}
              onRemove={removeMember}
            />
            <p className="text-sm text-gray-500 mt-2">
              Tip: You must have exactly one Owner.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 rounded-lg border bg-black text-white"
            >
              Save Committee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function MemberForm({ initial, onAdd, onSave, onCancel }) {
  const [name, setName] = useState(initial?.name || "");
  const [role, setRole] = useState(initial?.role || "");
  const [permissions, setPermissions] = useState(
    initial?.permissions || ["createMotion", "discussion", "moveToVote", "vote"]
  );

  const isEditing = Boolean(initial?.id);

  function togglePerm(p) {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }

  function handleAddOrSave() {
    const member = {
      id: initial?.id,
      name: name.trim(),
      role,
      permissions,
    };
    if (isEditing) onSave(member);
    else onAdd(member);
    if (!isEditing) {
      setName("");
      setRole("");
      setPermissions(["createMotion", "discussion", "moveToVote", "vote"]);
    }
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="col-span-1">
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          className="w-full border rounded-lg px-3 py-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Member name"
          required
        />
      </div>

      <div className="col-span-1">
        <label className="block text-sm font-medium mb-1">Role</label>
        <select
          className="w-full border rounded-lg px-3 py-2 bg-white"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        >
          <option value="" disabled>
            Select a role
          </option>
          <option value="owner">Owner</option>
          <option value="chair">Chair</option>
          <option value="member">Member</option>
          <option value="observer">Observer</option>
        </select>
      </div>

      <div className="col-span-2">
        <p className="text-sm font-medium mb-1">Permissions</p>
        <div className="flex flex-wrap gap-4">
          {[
            { v: "createMotion", label: "Create Motion" },
            { v: "discussion", label: "Discussion" },
            { v: "moveToVote", label: "Move to Vote" },
            { v: "vote", label: "Vote" },
          ].map((p) => (
            <label key={p.v} className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={permissions.includes(p.v)}
                onChange={() => togglePerm(p.v)}
              />
              <span>{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="col-span-2 flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleAddOrSave}
          className="px-3 py-2 rounded-lg border bg-black text-white"
        >
          {isEditing ? "Save Edit" : "Add Member"}
        </button>
        {isEditing && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-2 rounded-lg border"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

function MembersTable({ members, cap, onEdit, onRemove }) {
  if (!members.length) {
    return (
      <div className="border rounded-lg p-4 text-sm text-gray-600">
        No members added yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Role</th>
            <th className="px-3 py-2">Permissions</th>
            <th className="px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-t">
              <td className="px-3 py-2">{m.name}</td>
              <td className="px-3 py-2 capitalize">{cap(m.role)}</td>
              <td className="px-3 py-2 text-sm">
                {m.permissions?.length ? m.permissions.join(", ") : "—"}
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(m.id)}
                    className="px-2 py-1 rounded border"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(m.id)}
                    className="px-2 py-1 rounded border"
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
