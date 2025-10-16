<<<<<<< HEAD
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function CommitteeCreate() {
  const navigate = useNavigate();
  const { appData, setAppData } = useAuth();

  const [committeeName, setCommitteeName] = useState("");
  const [members, setMembers] = useState([]); // { id, name, role, permissions }
  const [editingId, setEditingId] = useState(null);

  const hasOwner = useMemo(
    () => members.some((m) => m.role === "owner"),
    [members]
  );
=======
// src/pages/CommitteeCreate.jsx
import React, { useMemo, useState } from "react";

export default function CommitteeCreate() {
  const [committeeName, setCommitteeName] = useState("");
  const [members, setMembers] = useState([]); // {id,name,role,permissions:[]}
  const [editingId, setEditingId] = useState(null);
>>>>>>> main
  const ownerCount = useMemo(
    () => members.filter((m) => m.role === "owner").length,
    [members]
  );
<<<<<<< HEAD

  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    permissions: ["createMotion", "discussion", "moveToVote", "vote"],
  });

  function resetMemberInputs() {
    setMemberForm({ name: "", role: "", permissions: ["createMotion", "discussion", "moveToVote", "vote"] });
  }

  function startEdit(id) {
    const m = members.find((x) => x.id === id);
    if (!m) return;
    setEditingId(id);
    setMemberForm({ name: m.name, role: m.role, permissions: [...m.permissions] });
  }

  function cancelEdit() {
    setEditingId(null);
    resetMemberInputs();
  }

  function removeMember(id) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    if (editingId === id) cancelEdit();
  }

  function togglePerm(value) {
    setMemberForm((prev) => {
      const exists = prev.permissions.includes(value);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter((p) => p !== value)
          : [...prev.permissions, value],
      };
    });
  }

  function addMemberFromForm() {
    const name = memberForm.name.trim();
    const role = memberForm.role;
    const permissions = memberForm.permissions;

    if (!name || !role) {
      alert("Please provide a name and select a role.");
      return;
    }
    if (role === "owner" && hasOwner) {
      alert("There can be only one Owner. Change the existing Owner to another role first.");
      return;
=======
  const editingMember = members.find((m) => m.id === editingId) || null;

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  function addMember({ name, role, permissions }) {
    if (!name || !role) return alert("Please provide a name and select a role.");
    if (role === "owner" && ownerCount >= 1) {
      return alert("There can be only one Owner. Change the existing Owner first.");
>>>>>>> main
    }
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, role, permissions },
    ]);
<<<<<<< HEAD
    resetMemberInputs();
  }

  function saveEditFromForm() {
    if (!editingId) return;
    const name = memberForm.name.trim();
    const role = memberForm.role;
    const permissions = memberForm.permissions;

    if (!name || !role) {
      alert("Please provide a name and select a role.");
      return;
    }

    const idx = members.findIndex((m) => m.id === editingId);
    if (idx === -1) return;

    const wasOwner = members[idx].role === "owner";
    const willBeOwner = role === "owner";

    if (willBeOwner && ownerCount === 1 && !wasOwner) {
      alert("There can be only one Owner. Change the existing Owner to another role first.");
      return;
    }
    if (!willBeOwner && wasOwner && ownerCount === 1) {
      alert("You must have exactly one Owner. Assign another member as Owner before changing this role.");
      return;
    }

    const updated = [...members];
    updated[idx] = { ...updated[idx], name, role, permissions };
    setMembers(updated);
    cancelEdit();
  }

  async function submitCommittee(e) {
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
=======
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
>>>>>>> main

    const payload = {
      committeeName: name,
      members,
<<<<<<< HEAD
      settings: { offlineMode: true, minSpeakersBeforeVote: 2, recordNamesInVotes: false, allowSpecialMotions: true },
    };

    try {
      const resp = await fetch('/create-committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });
      if (!resp.ok) throw new Error(await resp.text());

      // add locally for demo flow
      const newCommittee = { id: Date.now(), name, members, motions: [] };
      setAppData({ ...appData, committees: [...(appData.committees||[]), newCommittee] });
      alert('Committee created successfully!');
      navigate(`/committees/${newCommittee.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to create committee: ' + err.message);
=======
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
>>>>>>> main
    }
  }

  return (
<<<<<<< HEAD
    <div className="committee-create wrapper">
      <h1>Create a Committee</h1>
      <form onSubmit={submitCommittee} id="createCommitteeForm">
        <div className="committee-name">
          <label htmlFor="committeeName">Committee Name:</label>
          <input id="committeeName" value={committeeName} onChange={(e)=>setCommitteeName(e.target.value)} placeholder="Enter a committee name" required />
        </div>

        <div className="add-member">
          <h2>Add New Member</h2>
          <div className="member-form">
            <label htmlFor="memberName">Name:</label>
            <input id="memberName" value={memberForm.name} onChange={(e)=>setMemberForm((p)=>({...p, name: e.target.value}))} placeholder="Member name" required />

            <label htmlFor="memberRole">Role:</label>
            <select id="memberRole" value={memberForm.role} onChange={(e)=>setMemberForm((p)=>({...p, role: e.target.value}))} required>
              <option value="" disabled>Select a role</option>
              <option value="owner">Owner</option>
              <option value="chair">Chair</option>
              <option value="member">Member</option>
              <option value="observer">Observer</option>
            </select>

            <p>Permissions:</p>
            <div className="permissions" id="permissionsGroup">
              {[
                { key: 'createMotion', label: 'Create Motion' },
                { key: 'discussion', label: 'Discussion' },
                { key: 'moveToVote', label: 'Move to Vote' },
                { key: 'vote', label: 'Vote' },
              ].map((perm) => (
                <label key={perm.key} style={{ display: 'block' }}>
                  <input
                    type="checkbox"
                    checked={memberForm.permissions.includes(perm.key)}
                    onChange={() => togglePerm(perm.key)}
                  /> {perm.label}
                </label>
              ))}
            </div>

            {!editingId ? (
              <button type="button" className="add-btn" onClick={addMemberFromForm}>Add Member</button>
            ) : (
              <>
                <button type="button" className="add-btn" onClick={saveEditFromForm}>Save Edit</button>
                <button type="button" className="add-btn" onClick={cancelEdit}>Cancel</button>
              </>
            )}
          </div>
        </div>

        <div className="members-list">
          <h2>Members List</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Permissions</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="membersTbody">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty">No members added yet.</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{cap(m.role)}</td>
                    <td>{m.permissions.length ? m.permissions.join(', ') : '—'}</td>
                    <td>
                      <button className="edit-btn" type="button" onClick={() => startEdit(m.id)}>Edit</button>
                      <button className="delete-btn" type="button" onClick={() => removeMember(m.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <p id="membersHint" className="hint">Tip: You must have exactly one Owner.</p>
        </div>

        <div className="save-container">
          <button className="save-btn" id="saveCommitteeBtn" type="submit">Save Committee</button>
        </div>
      </form>
=======
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
>>>>>>> main
    </div>
  );
}

<<<<<<< HEAD
=======
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
>>>>>>> main
