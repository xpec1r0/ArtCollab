// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import axios from "axios";
import toast from "react-hot-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  const persistUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("auth_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("auth_user");
    }
  };

  const persistToken = (token) => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await api.get("/auth/me");
      const data = res.data;

      let currentUser = data?.user || data?.currentUser || data?.data || null;

      if (
        !currentUser &&
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {
        currentUser = data;
      }

      if (!currentUser) {
        persistUser(null);
        return null;
      }

      persistUser(currentUser);
      return currentUser;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        persistUser(null);
        persistToken(null);
        return null;
      }

      console.error("AUTH /auth/me error =>", error);
      throw error;
    }
  };

  // ---- On app mount, try to sync with backend once ----
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        setLoading(true);
        const currentUser = await fetchCurrentUser();
        if (cancelled) return;

        if (!currentUser) {
          persistUser(null);
        }
      } catch {
        if (!cancelled) {
          persistUser(null);
          persistToken(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async ({ identifier, password }) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        // send both in case the backend validates email or username
        email: identifier,
        username: identifier,
        password,
      });

      const data = res.data;
      console.log("LOGIN RESPONSE =>", data);

      // If backend returns token, store it (for Authorization header, sockets, etc.)
      const token = data?.token || data?.accessToken || null;
      persistToken(token || null);

      // Try to get user from login response
      let loggedUser = data?.user || data?.currentUser || data?.data || null;

      if (
        !loggedUser &&
        data &&
        typeof data === "object" &&
        !Array.isArray(data)
      ) {
        loggedUser = data;
      }

      // If login response already has a clean user, we trust it;
      // otherwise we call /auth/me so the backend defines the shape.
      if (loggedUser) {
        persistUser(loggedUser);
      } else if (token) {
        const currentUser = await fetchCurrentUser();
        if (currentUser) {
          persistUser(currentUser);
        } else {
          persistUser({
            username: identifier,
            anonymous: true,
          });
        }
      } else {
        // Ni user ni token → algo raro en el backend
        persistUser(null);
        persistToken(null);
      }

      toast.success("Signed in successfully");
    } catch (error) {
      // On any login error, clear state
      persistUser(null);
      persistToken(null);

      if (axios.isAxiosError(error)) {
        console.error("LOGIN ERROR =>", error.response?.data);
      } else {
        console.error("LOGIN ERROR =>", error);
      }

      // rethrow so the login page can display field/form errors
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---- register ----
  const register = async (payload) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/register", payload);
      const data = res.data;

      let createdUser = data?.user || data?.currentUser || data?.data || null;
      const token = data?.token || data?.accessToken || null;

      if (token) {
        persistToken(token);
      } else {
        persistToken(null);
      }

      if (createdUser && token) {
        // Auto-login scenario
        persistUser(createdUser);
      } else {
        // Typical flow: account created, then user goes to /login
        persistUser(null);
      }

      toast.success("Account created");
      return data;
    } catch (error) {
      persistUser(null);
      persistToken(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // ---- logout ----
  const logout = async () => {
    setLoading(true);
    try {
      // if /auth/logout exists, we try it; if not, we just clear local state
      try {
        await api.post("/auth/logout");
      } catch (err) {
        console.warn(
          "Logout endpoint error (ignored) =>",
          err?.response?.data || err
        );
      }

      persistUser(null);
      persistToken(null);
      toast.success("Signed out");
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>");
  }
  return ctx;
}
