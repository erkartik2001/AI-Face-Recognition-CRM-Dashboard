/**
 * Bucket Management Page
 *
 * Admin only:
 * - List all registered B2 buckets with sync stats
 * - Add a new bucket
 * - Set active bucket
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function BucketsPage() {
  const router = useRouter();
  const { loggedIn, loading, user, token } = useAuth();

  const [buckets, setBuckets] = useState([]);
  const [loadingBuckets, setLoadingBuckets] = useState(true);
  const [message, setMessage] = useState(null);

  // Add form
  const [newBucket, setNewBucket] = useState("");
  const [adding, setAdding] = useState(false);
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    if (!loading && loggedIn && user?.role === "admin" && token) {
      loadBuckets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loggedIn, user, token]);

  async function loadBuckets() {
    setLoadingBuckets(true);
    const res = await apiClient.getBuckets(token);
    if (res.success && res.buckets) {
      setBuckets(res.buckets);
    } else {
      setMessage({ type: "error", text: res.message || "Failed to load buckets" });
    }
    setLoadingBuckets(false);
  }

  async function handleAddBucket(e) {
    e.preventDefault();
    if (!newBucket.trim()) return;

    setAdding(true);
    setMessage(null);

    const res = await apiClient.addBucket(newBucket.trim(), token);

    if (res.success) {
      setMessage({ type: "success", text: res.message });
      setNewBucket("");
      loadBuckets();
    } else {
      setMessage({ type: "error", text: res.message || "Failed to add bucket" });
    }

    setAdding(false);
  }

  async function handleActivate(bucketName) {
    setActivating(bucketName);
    setMessage(null);

    const res = await apiClient.setActiveBucket(bucketName, token);

    if (res.success) {
      setMessage({ type: "success", text: res.message });
      loadBuckets();
    } else {
      setMessage({ type: "error", text: res.message || "Failed to activate bucket" });
    }

    setActivating(null);
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
          <div className="alert alert-warning">⚠️ Login First</div>
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
        <h1 className="page-title">Bucket Management</h1>
        <p className="page-subtitle">Manage B2 storage buckets for face indexing</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`} style={{ maxWidth: 700 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Add Bucket Form */}
      <div className="card" style={{ maxWidth: 700, marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-title">➕ Add New Bucket</div>
        </div>
        <form onSubmit={handleAddBucket} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label className="form-label" htmlFor="new-bucket-name">B2 Bucket Name</label>
            <input
              id="new-bucket-name"
              className="form-input"
              type="text"
              placeholder="my-new-bucket"
              value={newBucket}
              onChange={(e) => setNewBucket(e.target.value)}
              disabled={adding}
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={adding || !newBucket.trim()}
            style={{ height: 46 }}
          >
            {adding ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
            ) : (
              "Add Bucket"
            )}
          </button>
        </form>
      </div>

      {/* Buckets List */}
      {loadingBuckets ? (
        <div className="spinner-overlay">
          <div className="spinner"></div>
          <span className="spinner-text">Loading buckets...</span>
        </div>
      ) : (
        <div style={{ maxWidth: 700 }}>
          {buckets.map((b, idx) => (
            <div
              className={`bucket-card ${b.is_active ? "active" : ""}`}
              key={b.bucket_name}
              id={`bucket-${idx}`}
            >
              <div className="bucket-card-header">
                <div>
                  <div className="bucket-card-name">
                    🪣 {b.bucket_name}
                  </div>
                  <div className="bucket-card-meta">
                    Added by {b.created_by || "system"} · {b.created_at || "—"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {b.is_active ? (
                    <span className="status-badge status-active">● Active</span>
                  ) : (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleActivate(b.bucket_name)}
                      disabled={activating === b.bucket_name}
                    >
                      {activating === b.bucket_name ? (
                        <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                      ) : (
                        "Set Active"
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Sync Stats */}
              <div className="bucket-stats">
                <div className="bucket-stat">
                  <div className="bucket-stat-label">Total Synced</div>
                  <div className="bucket-stat-value">{b.total_synced?.toLocaleString() ?? "—"}</div>
                </div>
                <div className="bucket-stat">
                  <div className="bucket-stat-label">Total Files</div>
                  <div className="bucket-stat-value">{b.total_files?.toLocaleString() ?? "Unknown"}</div>
                </div>
                <div className="bucket-stat">
                  <div className="bucket-stat-label">Remaining</div>
                  <div className="bucket-stat-value">{b.remaining?.toLocaleString() ?? "—"}</div>
                </div>
                <div className="bucket-stat">
                  <div className="bucket-stat-label">Last Sync</div>
                  <div className="bucket-stat-value">{b.last_sync_date || "Never"}</div>
                </div>
              </div>
            </div>
          ))}

          {buckets.length === 0 && !loadingBuckets && (
            <div className="alert alert-warning">No buckets registered yet.</div>
          )}
        </div>
      )}
    </main>
  );
}
