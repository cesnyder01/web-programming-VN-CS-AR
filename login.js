const data = {
    users: [
        { username: "amy", password: "pass1", lastLogin: null, loginAttempts: 0},
        { username: "bob", password: "pass2", lastLogin: null, loginAttempts: 0}
    ],

    auth: {
        isAuthenticated: false,
        currentUser: null //{ username, ...} when someone is logged in
    },

    ui: {
        error: null,
        notice: null
    },
    activity: []
};

function getUser(username){
    return data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

function login(username, password){
    data.ui.error = null;
    data.ui.notice = null;
    const user = getUser(username);

    if (!user) {
        data.ui.error = "User not found";
        return;
    }

    user.loginAttempts += 1;

    if (user.password !== password) {
        data.ui.error = "Incorrect password";
        return;
    }
     data.auth.isAuthenticated = true;
  data.auth.currentUser = { username: user.username };
  user.lastLogin = new Date().toISOString();
  data.ui.notice = `Welcome, ${user.username}!`;
  data.activity.push(`[${new Date().toLocaleTimeString()}] ${user.username} logged in.`);
  render();
}

//logout function
//register function
