export const STORAGE_KEY = "appData";

export function loadAppData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  const seed = {
    users: [
      { id: 1, name: "Alice", email: "alice@example.com", password: "1234" },
      { id: 2, name: "Vedha", email: "vedha@example.com", password: "abcd" }
    ],
    auth: { isLoggedIn: false, currentUser: null },
    committees: [
      {
        id: 1,
        name: "Sustainability Committee",
        members: [
          { name: "Alice", role: "Chair", permissions: ["createMotion", "vote", "discussion"] },
          { name: "Vedha", role: "Member", permissions: ["discussion", "vote"] }
        ],
        motions: []
      }
    ]
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

