// --- Simple state store ---
let members = [];          // { id, name, role, permissions: ['createMotion', ...] }
let editingId = null;      // currently editing member id (or null)

// --- Helper Functions ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function getPermissionsFromForm() {
  return $$('#permissionsGroup input[name="permissions"]:checked').map(c => c.value);
}

function resetMemberInputs() {
  $('#memberName').value = '';
  $('#memberRole').value = '';
  $$('#permissionsGroup input[name="permissions"]').forEach(c => (c.checked = true));
}

function renderMembers() {
  const tbody = $('#membersTbody');
  tbody.innerHTML = '';

  if (members.length === 0) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'No members added yet.';
    td.className = 'empty';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

  members.forEach(m => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = m.name;

    const tdRole = document.createElement('td');
    tdRole.textContent = cap(m.role);

    const tdPerm = document.createElement('td');
    tdPerm.textContent = m.permissions.length ? m.permissions.join(', ') : '—';

    const tdActions = document.createElement('td');
    const editBtn = document.createElement('button');
    editBtn.className = 'edit-btn';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => startEdit(m.id));

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => removeMember(m.id));

    tdActions.append(editBtn, ' ', removeBtn);

    tr.append(tdName, tdRole, tdPerm, tdActions);
    tbody.appendChild(tr);
  });
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function hasOwner() {
  return members.some(m => m.role === 'owner');
}

function ownerCount() {
  return members.filter(m => m.role === 'owner').length;
}

function startEdit(id) {
  const m = members.find(x => x.id === id);
  if (!m) return;
  editingId = id;

  // Fill the form
  $('#memberName').value = m.name;
  $('#memberRole').value = m.role;
  $$('#permissionsGroup input[name="permissions"]').forEach(c => {
    c.checked = m.permissions.includes(c.value);
  });

  // Toggle buttons
  $('#addMemberBtn').style.display = 'none';
  $('#saveEditBtn').style.display = 'inline-block';
  $('#cancelEditBtn').style.display = 'inline-block';
}

function cancelEdit() {
  editingId = null;
  resetMemberInputs();
  $('#addMemberBtn').style.display = 'inline-block';
  $('#saveEditBtn').style.display = 'none';
  $('#cancelEditBtn').style.display = 'none';
}

function removeMember(id) {
  const removed = members.find(m => m.id === id);
  members = members.filter(m => m.id !== id);

  // Prevent removing the only owner
  if (removed?.role === 'owner' && !hasOwner()) {
    alert('You must have exactly one Owner. Add a new Owner or change a member to Owner before removing the current Owner.');
    // Revert removal
    members.push(removed);
    return;
  }

  renderMembers();
}

function addMemberFromForm() {
  const name = $('#memberName').value.trim();
  const role = $('#memberRole').value;
  const permissions = getPermissionsFromForm();

  if (!name || !role) {
    alert('Please provide a name and select a role.');
    return;
  }

  // Enforce single owner
  if (role === 'owner' && hasOwner()) {
    alert('There can be only one Owner. Change the existing Owner to another role first.');
    return;
  }

  members.push({
    id: crypto.randomUUID(),
    name,
    role,
    permissions
  });

  resetMemberInputs();
  renderMembers();
}

function saveEditFromForm() {
  if (!editingId) return;

  const name = $('#memberName').value.trim();
  const role = $('#memberRole').value;
  const permissions = getPermissionsFromForm();

  if (!name || !role) {
    alert('Please provide a name and select a role.');
    return;
  }

  const idx = members.findIndex(m => m.id === editingId);
  if (idx === -1) return;

  const wasOwner = members[idx].role === 'owner';
  const willBeOwner = role === 'owner';

  // Enforce exactly one owner
  if (willBeOwner && ownerCount() === 1 && !wasOwner) {
    alert('There can be only one Owner. Change the existing Owner to another role first.');
    return;
  }
  if (!willBeOwner && wasOwner && ownerCount() === 1) {
    alert('You must have exactly one Owner. Assign another member as Owner before changing this role.');
    return;
  }

  members[idx] = { ...members[idx], name, role, permissions };
  cancelEdit();
  renderMembers();
}

async function submitCommittee(e) {
  e.preventDefault();

  const committeeName = $('#committeeName').value.trim();
  if (!committeeName) {
    alert('Please enter a committee name.');
    return;
  }
  if (members.length === 0) {
    alert('Please add at least one member (and exactly one Owner).');
    return;
  }
  if (ownerCount() !== 1) {
    alert('You must have exactly one Owner.');
    return;
  }

  const payload = {
    committeeName,
    members,
    //default settings CAN REMOVE
    settings: { offlineMode: true, minSpeakersBeforeVote: 2, recordNamesInVotes: false, allowSpecialMotions: true }
  };

  try {
    const resp = await fetch('/create-committee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include' // in case you rely on cookies/session
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(err || `Request failed with status ${resp.status}`);
    }

    // UX
    const data = await resp.json().catch(() => ({}));
    alert('Committee created successfully!');
    // Redirect if backend returns a URL or ID
    // if (data.committeeId) window.location.href = `/committee/${data.committeeId}`;
    // else window.location.href = '/committees';
    // For now, reset:
    $('#createCommitteeForm').reset();
    members = [];
    renderMembers();
  } catch (err) {
    console.error(err);
    alert('Failed to create committee: ' + err.message);
  }
}

// --- Event bindings ---
document.addEventListener('DOMContentLoaded', () => {
  // Buttons
  $('#addMemberBtn').addEventListener('click', addMemberFromForm);
  $('#saveEditBtn').addEventListener('click', saveEditFromForm);
  $('#cancelEditBtn').addEventListener('click', cancelEdit);

  // Submit
  $('#createCommitteeForm').addEventListener('submit', submitCommittee);

  // Initial render
  renderMembers();
});
