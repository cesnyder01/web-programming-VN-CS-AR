import React, { createContext, useContext, useMemo, useState } from "react";
import { loadAppData, saveAppData } from "../utils/storage.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [appData, setAppData] = useState(() => loadAppData());

  function persist(next) {
    setAppData(next);
    saveAppData(next);
  }

  const login = (email, password) => {
    const user = appData.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    if (!user) throw new Error("Invalid email or password.");
    const next = { ...appData, auth: { isLoggedIn: true, currentUser: user } };
    persist(next);
    return user;
  };

  const register = (name, email, password) => {
    if (appData.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error("Email already registered.");
    }
    const newUser = { id: Date.now(), name, email, password };
    const nextUsers = [...appData.users, newUser];
    const next = { ...appData, users: nextUsers, auth: { isLoggedIn: true, currentUser: newUser } };
    persist(next);
    return newUser;
  };

  const logout = () => {
    const next = { ...appData, auth: { isLoggedIn: false, currentUser: null } };
    persist(next);
  };

  const value = useMemo(
    () => ({ appData, setAppData: persist, login, register, logout }),
    [appData]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

