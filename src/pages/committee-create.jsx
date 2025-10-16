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
  const ownerCount = useMemo(
    () => members.filter((m) => m.role === "owner").length,
    [members]
  );

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
    }
    setMembers((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name, role, permissions },
    ]);
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

    const payload = {
      committeeName: name,
      members,
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
    }
  }

  return (
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
    </div>
  );
}

