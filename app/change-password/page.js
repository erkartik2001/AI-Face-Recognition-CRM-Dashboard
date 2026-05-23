/**
 * Change Password Page
 *
 * Replica of: frontend/pages/change_password.py
 *
 * - Admin only
 * - Form: username, new password
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const { loggedIn, loading, user, token } = useAuth();

  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

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
          <div className="alert alert-warning">⚠️ Login First</div>
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
          <div className="alert alert-error">🚫 Admin Only</div>
          <button className="btn btn-primary" onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </main>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage(null);

    if (!username || !newPassword) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiClient.changePassword(username, newPassword, token);

      // Backend returns { message: "Password updated" } on success (no "success" field)
      // _fetch wrapper returns { success: false, message: "..." } on HTTP errors (403, etc.)
      if (response.success === false) {
        setMessage({
          type: "error",
          text: response.message || "Failed",
        });
      } else if (response.message) {
        setMessage({ type: "success", text: response.message });
        setUsername("");
        setNewPassword("");
      } else {
        setMessage({ type: "error", text: "Unexpected response" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to change password" });
    }

    setSubmitting(false);
  }

  return (
    <main className="main-content fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Change User Password</h1>
        <p className="page-subtitle">Update a user&apos;s password</p>
      </div>

      {/* Form Card */}
      <div className="card" style={{ maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="target-username">
              Username
            </label>
            <input
              id="target-username"
              className="form-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              New Password
            </label>
            <input
              id="new-password"
              className="form-input"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting}
            id="change-password-btn"
          >
            {submitting ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                Changing...
              </>
            ) : (
              "🔑 Change Password"
            )}
          </button>
        </form>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 20, maxWidth: 500 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}
    </main>
  );
}
