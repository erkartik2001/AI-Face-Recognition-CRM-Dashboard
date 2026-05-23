/**
 * Create User Page
 *
 * Replica of: frontend/pages/create_user.py
 *
 * - Admin only
 * - Form: username, password, role
 * - Shows QR code on success
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function CreateUserPage() {
  const router = useRouter();
  const { loggedIn, loading, user, token } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [qrCode, setQrCode] = useState(null);

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
    setQrCode(null);

    if (!username || !password) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiClient.createUser(username, password, role, token);

      // _fetch wrapper returns { success: false, message: "..." } on HTTP errors (400, 403)
      if (response.success === false) {
        setMessage({
          type: "error",
          text: response.message || "Failed",
        });
      } else if (response.success && response.qr_code) {
        setMessage({ type: "success", text: "User Created" });
        setQrCode(response.qr_code);
        setUsername("");
        setPassword("");
        setRole("user");
      } else {
        setMessage({ type: "error", text: "Unexpected response" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to create user" });
    }

    setSubmitting(false);
  }

  return (
    <main className="main-content fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Create User</h1>
        <p className="page-subtitle">Add a new user to the system</p>
      </div>

      {/* Form Card */}
      <div className="card" style={{ maxWidth: 500 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="new-username">
              Username
            </label>
            <input
              id="new-username"
              className="form-input"
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="new-password">
              Password
            </label>
            <input
              id="new-password"
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="role-select">
              Role
            </label>
            <select
              id="role-select"
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={submitting}
            id="create-user-btn"
          >
            {submitting ? (
              <>
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                Creating...
              </>
            ) : (
              "➕ Create User"
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

      {/* QR Code */}
      {qrCode && (
        <div className="card fade-in" style={{ maxWidth: 500, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">🛡️ Google Authenticator QR Code</div>
          </div>
          <div className="qr-container">
            <div className="qr-code-img">
              <img
                src={`data:image/png;base64,${qrCode}`}
                alt="2FA QR Code"
              />
            </div>
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Scan this QR code with Google Authenticator
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
