const API_BASE_URL = "/api"; // Updated to use relative paths for Netlify serverless functions

async function request(path, options = {}) {
  const finalOptions = {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body && !options.headers?.["Content-Type"] ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${path}`, finalOptions);
  let data = null;
  try {
    data = await response.clone().json();
  } catch (err) {
    data = null;
  }

  if (!response.ok) {
    const error = new Error(data?.message || "Request failed.");
    error.status = response.status;
    throw error;
  }

  return data;
}

export const api = {
  health: () => request("/health"),
  register: (payload) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  login: (payload) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),
  currentUser: () => request("/auth/me"),
  updateProfile: (payload) =>
    request("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  listCommittees: () => request("/committees"),
  createCommittee: (payload) =>
    request("/committees", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getCommitteeDetail: (id) => request(`/committees/${id}`),
  updateCommitteeSettings: (id, payload) =>
    request(`/committees/${id}/settings`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  raiseHand: (committeeId, payload) =>
    request(`/committees/${committeeId}/hands`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  lowerHand: (committeeId, handId) =>
    request(`/committees/${committeeId}/hands/${handId}`, {
      method: "DELETE",
    }),
  createMotion: (committeeId, payload) =>
    request(`/committees/${committeeId}/motions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  listMotions: (committeeId) => request(`/committees/${committeeId}/motions`),
  addDiscussion: (motionId, payload) =>
    request(`/committees/motions/${motionId}/discussion`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  castVote: (motionId, payload) =>
    request(`/committees/motions/${motionId}/votes`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  recordDecision: (motionId, payload) =>
    request(`/committees/motions/${motionId}/decision`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  createSubMotion: (motionId, payload) =>
    request(`/committees/motions/${motionId}/submotions`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitOverturn: (motionId, payload) =>
    request(`/committees/motions/${motionId}/overturn`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
