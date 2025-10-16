// -----------------------------
// Base Data Structure
// -----------------------------
const appData = {
    users: [
      { id: 1, name: "Alice", email: "alice@example.com", password: "1234" },
      { id: 2, name: "Vedha", email: "vedha@example.com", password: "abcd" }
    ],
  
    auth: {
      isLoggedIn: false,
      currentUser: null
    },
  
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
  
  // -----------------------------
  // Utility: Save + Load from localStorage
  // -----------------------------
  function saveData() {
    localStorage.setItem("appData", JSON.stringify(appData));
  }
  
  function loadData() {
    const saved = localStorage.getItem("appData");
    if (saved) {
      Object.assign(appData, JSON.parse(saved));
    }
  }
  
  // Load existing data when the page opens
  loadData();
  
  console.log("app.js loaded on:", window.location.pathname);
  console.log("Current app data:", appData);
  
  // -----------------------------
  // AUTH LOGIC (REGISTER + LOGIN)
  // -----------------------------
  
  function updateStorage() {
    localStorage.setItem("appData", JSON.stringify(appData));
  }
  
  function goToDashboard() {
    window.location.href = "dashboard.html";
  }
  
  // -----------------------------
  // REGISTER
  // -----------------------------
  const registerForm = document.querySelector(".register form");
  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
  
      if (appData.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        alert("Email already registered.");
        return;
      }
  
      const newUser = { id: Date.now(), name, email, password };
      appData.users.push(newUser);
      appData.auth.isLoggedIn = true;
      appData.auth.currentUser = newUser;
      updateStorage();
      alert("Account created successfully!");
      goToDashboard();
    });
  }
  
  // -----------------------------
  // LOGIN
  // -----------------------------
  const loginForm = document.querySelector(".login form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
  
      // make sure the latest saved data is loaded before checking
      loadData();
  
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
  
      const user = appData.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
  
      if (!user) {
        alert("Invalid email or password.");
        return;
      }
  
      appData.auth.isLoggedIn = true;
      appData.auth.currentUser = user;
      updateStorage();
      alert(`Welcome back, ${user.name}!`);
      goToDashboard();
    });
  }