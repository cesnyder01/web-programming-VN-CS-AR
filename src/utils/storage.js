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
          {
            id: "member-1",
            name: "Alice",
            role: "owner",
            permissions: ["createMotion", "vote", "discussion", "moveToVote"],
          },
          {
            id: "member-2",
            name: "Vedha",
            role: "chair",
            permissions: ["createMotion", "discussion", "moveToVote", "vote"],
          },
          {
            id: "member-3",
            name: "Casey",
            role: "member",
            permissions: ["discussion", "vote"],
          },
        ],
        settings: {
          offlineMode: true,
          minSpeakersBeforeVote: 2,
          recordNamesInVotes: false,
          allowSpecialMotions: true,
        },
        motions: [
          {
            id: "motion-1",
            title: "Adopt bi-weekly recycling pickup",
            description:
              "Pilot a recycling pickup program every other Friday for the fall semester.",
            type: "standard",
            status: "pending",
            createdAt: "2024-09-15T15:30:00.000Z",
            createdBy: 1,
            createdByName: "Alice",
          },
        ],
      },
    ],
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export function saveAppData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
