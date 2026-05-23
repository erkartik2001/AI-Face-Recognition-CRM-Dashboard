/**
 * Dashboard Page
 *
 * Replica of: frontend/pages/dashboard.py
 *
 * - Shows user info (Logged in as + Role as separate lines)
 * - Quick actions: Search Faces, Create User, Index Images
 * - Logout button
 */

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { loggedIn, loading, user, logout } = useAuth();

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

  const quickActions = [
    {
      icon: "🔍",
      label: "Search Faces",
      desc: "Search for matching faces in the database",
      href: "/search-face",
    },
    {
      icon: "➕",
      label: "Create User",
      desc: "Add a new user to the system",
      href: "/create-user",
    },
    {
      icon: "📂",
      label: "Index Images",
      desc: "Index B2 images for face recognition",
      href: "/indexing",
    },
  ];

  return (
    <main className="main-content fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">AI Face Recognition CRM</h1>
      </div>

      {/* User Info - Matches Streamlit: separate success alert + role text */}
      <div className="alert alert-success" style={{ marginBottom: 12 }}>
        ✅ Logged in as: <strong>{user?.username}</strong>
      </div>

      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
        Role: <strong style={{ textTransform: "capitalize" }}>{user?.role}</strong>
      </p>

      {/* Quick Actions */}
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          marginBottom: 20,
          color: "var(--text-primary)",
        }}
      >
        Quick Actions
      </h2>

      <div className="stats-grid">
        {quickActions.map((action) => (
          <div
            key={action.href}
            className="stat-card"
            onClick={() => router.push(action.href)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && router.push(action.href)}
            id={`action-${action.href.slice(1)}`}
          >
            <div className="stat-card-icon">{action.icon}</div>
            <div className="stat-card-label">{action.label}</div>
            <div className="stat-card-desc">{action.desc}</div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <hr className="divider" />

      <button
        className="btn btn-danger"
        onClick={() => {
          logout();
          router.push("/");
        }}
        id="dashboard-logout-btn"
      >
        🚪 Logout
      </button>
    </main>
  );
}
