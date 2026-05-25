/**
 * Users List Page
 *
 * - Admin only
 * - Lists all users with role, created_at, last_login, status
 * - Delete user (with confirmation)
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
  const [deleting, setDeleting] = useState(null);

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

      if (response.success === false) {
        setMessage({ type: "error", text: response.message || "Failed to load users" });
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

  async function handleDelete(username) {
    if (!confirm(`Are you sure you want to delete "${username}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(username);
    setMessage(null);

    const res = await apiClient.deleteUser(username, token);

    if (res.success) {
      setMessage({ type: "success", text: `User "${username}" deleted` });
      loadUsers();
    } else {
      setMessage({ type: "error", text: res.message || "Failed to delete user" });
    }

    setDeleting(null);
  }

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
      <div className="page-header">
        <h1 className="page-title">Users List</h1>
        <p className="page-subtitle">Manage all system users</p>
      </div>

      {loadingUsers && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
          <span className="spinner-text">Loading users...</span>
        </div>
      )}

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "error" && "❌ "}
          {message.type === "warning" && "⚠️ "}
          {message.type === "success" && "✅ "}
          {message.text}
        </div>
      )}

      {users.length > 0 && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          ✅ Total Users: <strong>{users.length}</strong>
        </div>
      )}

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

          {/* Delete button — not for current user */}
          <div>
            {u.username !== user?.username && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(u.username)}
                disabled={deleting === u.username}
                id={`delete-user-${idx}`}
                title={`Delete ${u.username}`}
              >
                {deleting === u.username ? (
                  <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                ) : (
                  "🗑️"
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
