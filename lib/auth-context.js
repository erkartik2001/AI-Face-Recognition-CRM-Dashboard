/**
 * Auth Context
 *
 * Replica of: frontend/utils/auth.py
 *
 * Replaces Streamlit session_state with React Context + localStorage
 */

"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("crm_token");
    const savedUser = localStorage.getItem("crm_user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      setLoggedIn(true);
    }

    setLoading(false);
  }, []);

  // -----------------------------
  // SAVE LOGIN
  // -----------------------------
  function saveLogin(newToken, userData) {
    setToken(newToken);
    setUser(userData);
    setLoggedIn(true);

    localStorage.setItem("crm_token", newToken);
    localStorage.setItem("crm_user", JSON.stringify(userData));
  }

  // -----------------------------
  // LOGOUT
  // -----------------------------
  function logout() {
    setToken(null);
    setUser(null);
    setLoggedIn(false);

    localStorage.removeItem("crm_token");
    localStorage.removeItem("crm_user");
  }

  // -----------------------------
  // CHECK LOGIN
  // -----------------------------
  function isLoggedIn() {
    return loggedIn;
  }

  // -----------------------------
  // GET TOKEN
  // -----------------------------
  function getToken() {
    return token;
  }

  // -----------------------------
  // GET USER
  // -----------------------------
  function getUser() {
    return user;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loggedIn,
        loading,
        saveLogin,
        logout,
        isLoggedIn,
        getToken,
        getUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
