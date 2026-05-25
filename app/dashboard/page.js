/**
 * Dashboard Page
 *
 * - Shows user info + role
 * - Quick actions: Search Faces, Index Images, Buckets, Sync Logs
 * - Index stats (total vectors)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function DashboardPage() {
  const router = useRouter();
  const { loggedIn, loading, user, token, logout } = useAuth();

  const [indexStats, setIndexStats] = useState(null);

  useEffect(() => {
    if (!loading && loggedIn) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loggedIn]);

  async function loadStats() {
    const res = await apiClient.getIndexStats();
    if (res.success) setIndexStats(res);
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

  const isAdmin = user?.role === "admin";

  const quickActions = [
    {
      icon: "🔍",
      label: "Search Faces",
      desc: "Search for matching faces in the database",
      href: "/search-face",
    },
    {
      icon: "📂",
      label: "Index Images",
      desc: "Index B2 images for face recognition",
      href: "/indexing",
    },
    ...(isAdmin
      ? [
          {
            icon: "🪣",
            label: "Buckets",
            desc: "Manage B2 storage buckets",
            href: "/buckets",
          },
          {
            icon: "📋",
            label: "Sync Logs",
            desc: "View indexing stats & history",
            href: "/sync-logs",
          },
          {
            icon: "👥",
            label: "Users",
            desc: "Manage system users",
            href: "/users",
          },
          {
            icon: "➕",
            label: "Create User",
            desc: "Add a new user to the system",
            href: "/create-user",
          },
        ]
      : []),
  ];

  return (
    <main className="main-content fade-in">
      <div className="page-header">
        <h1 className="page-title">AI Face Recognition CRM</h1>
      </div>

      {/* User Info */}
      <div className="alert alert-success" style={{ marginBottom: 12 }}>
        ✅ Logged in as: <strong>{user?.username}</strong>
      </div>

      <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 32 }}>
        Role: <strong style={{ textTransform: "capitalize" }}>{user?.role}</strong>
      </p>

      {/* Index Stats */}
      {indexStats && (
        <div className="stats-grid" style={{ maxWidth: 480, marginBottom: 32 }}>
          <div className="stat-card" style={{ cursor: "default" }}>
            <div className="stat-card-icon">🧠</div>
            <div className="stat-card-label">{indexStats.total_vectors?.toLocaleString()}</div>
            <div className="stat-card-desc">FAISS Vectors</div>
          </div>
          <div className="stat-card" style={{ cursor: "default" }}>
            <div className="stat-card-icon">🗺️</div>
            <div className="stat-card-label">{indexStats.total_mappings?.toLocaleString()}</div>
            <div className="stat-card-desc">Image Mappings</div>
          </div>
        </div>
      )}

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
