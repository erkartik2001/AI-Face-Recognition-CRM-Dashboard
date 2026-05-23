/**
 * Users List Page
 *
 * Replica of: frontend/pages/users.py
 *
 * - Admin only
 * - Lists all users with role, created_at, last_login, status
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function UsersPage() {
  const router = useRouter();
  const { loggedIn, loading, user, token } = useAuth();

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!loading && loggedIn && user?.role === "admin" && token) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loggedIn, user, token]);

  async function loadUsers() {
    setLoadingUsers(true);
    try {
      const response = await apiClient.getUsers(token);

      // HTTP error (401 expired token, etc.) or admin check failed
      if (response.success === false) {
        setMessage({
          type: "error",
          text: response.message || "Failed to load users",
        });
      } else if (response.success === true) {
        const userList = response.users || [];
        if (userList.length === 0) {
          setMessage({ type: "warning", text: "No users found" });
        }
        setUsers(userList);
      } else {
        setMessage({ type: "error", text: "Unexpected response" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to load users" });
    }
    setLoadingUsers(false);
  }

  // Loading state
  if (loading) {
    return (
      <main className="main-content">
        <div className="spinner-overlay" style={{ minHeight: "60vh" }}>
          <div className="spinner"></div>
          <span className="spinner-text">Loading...</span>
        </div>
      </main>
    );
  }

  // Auth check
  if (!loggedIn) {
    return (
      <main className="main-content no-sidebar">
        <div style={{ padding: 40 }}>
          <div className="alert alert-warning">⚠️ Please login first</div>
          <button className="btn btn-primary" onClick={() => router.push("/")}>
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  // Admin check
  if (user?.role !== "admin") {
    return (
      <main className="main-content">
        <div style={{ padding: 40 }}>
          <div className="alert alert-error">🚫 Admin access only</div>
          <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="main-content fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Users List</h1>
        <p className="page-subtitle">Manage all system users</p>
      </div>

      {/* Loading */}
      {loadingUsers && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
          <span className="spinner-text">Loading users...</span>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "error" && "❌ "}
          {message.type === "warning" && "⚠️ "}
          {message.text}
        </div>
      )}

      {/* User Count */}
      {users.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          ✅ Total Users: <strong>{users.length}</strong>
        </div>
      )}

      {/* User Cards - matches Streamlit's 4-column layout with status */}
      {users.map((u, idx) => (
        <div className="user-card" key={u.username || idx} id={`user-card-${idx}`}>
          <div>
            <div className="user-card-field-label">Username</div>
            <div className="user-card-name">
              {idx + 1}. {u.username}
            </div>
          </div>

          <div>
            <div className="user-card-field-label">Role</div>
            <div className="user-card-field-value" style={{ textTransform: "capitalize" }}>
              {u.role}
            </div>
          </div>

          <div>
            <div className="user-card-field-label">Created At</div>
            <div className="user-card-field-value">{u.created_at || "N/A"}</div>
          </div>

          <div>
            <div className="user-card-field-label">Last Login</div>
            <div className="user-card-field-value">{u.last_login || "Never"}</div>
          </div>

          <div>
            <div className="user-card-field-label">Status</div>
            <div>
              {u.is_active !== false ? (
                <span className="status-badge status-active">● Active</span>
              ) : (
                <span className="status-badge status-disabled">● Disabled</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </main>
  );
}
