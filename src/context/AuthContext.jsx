import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../utils/api.js";

const AuthContext = createContext(null);

const initialState = {
  auth: { isLoggedIn: false, currentUser: null },
  committees: [],
};

export function AuthProvider({ children }) {
  const [appData, setAppData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function bootstrap() {
      try {
        const { user } = await api.currentUser();
        if (user) {
          const { committees } = await api.listCommittees();
          setAppData({
            auth: { isLoggedIn: true, currentUser: user },
            committees: committees || [],
          });
        } else {
          setAppData(initialState);
        }
      } catch (err) {
        setAppData(initialState);
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  async function refreshCommittees() {
    try {
      const { committees } = await api.listCommittees();
      setAppData((prev) => ({
        ...prev,
        committees: committees || [],
      }));
    } catch (err) {
      setError(err.message || "Unable to load committees.");
    }
  }

  const login = async (email, password) => {
    const { user } = await api.login({ email, password });
    setAppData((prev) => ({
      ...prev,
      auth: { isLoggedIn: true, currentUser: user },
    }));
    await refreshCommittees();
    return user;
  };

  const register = async (name, email, password) => {
    const { user } = await api.register({ name, email, password });
    setAppData({
      auth: { isLoggedIn: true, currentUser: user },
      committees: [],
    });
    return user;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // ignore
    }
    setAppData(initialState);
  };

  const value = useMemo(
    () => ({
      appData,
      login,
      register,
      logout,
      refreshCommittees,
      loading,
      error,
      setAppData,
    }),
    [appData, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
