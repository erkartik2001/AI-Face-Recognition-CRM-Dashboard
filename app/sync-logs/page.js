/**
 * Sync Logs Page
 *
 * Admin only:
 * - Per-bucket sync stats (total synced, remaining, bucket, last sync date)
 * - Current sync status if running
 * - Index stats (total vectors)
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function SyncLogsPage() {
  const router = useRouter();
  const { loggedIn, loading, user, token } = useAuth();

  const [logs, setLogs] = useState([]);
  const [syncJob, setSyncJob] = useState(null);
  const [inProgress, setInProgress] = useState(false);
  const [indexStats, setIndexStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!loading && loggedIn && user?.role === "admin" && token) {
      loadAllData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loggedIn, user, token]);

  async function loadAllData() {
    setLoadingData(true);

    const [logsRes, statusRes, statsRes] = await Promise.all([
      apiClient.getSyncLogs(token),
      apiClient.getSyncStatus(token),
      apiClient.getIndexStats(),
    ]);

    if (logsRes.success && logsRes.logs) {
      setLogs(logsRes.logs);
    }

    if (statusRes.success) {
      setInProgress(statusRes.in_progress);
      setSyncJob(statusRes.sync_job);
    }

    if (statsRes.success) {
      setIndexStats(statsRes);
    }

    setLoadingData(false);
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

  // Compute totals
  const totalSynced = logs.reduce((sum, l) => sum + (l.total_synced || 0), 0);
  const totalFiles = logs.reduce((sum, l) => sum + (l.total_files || 0), 0);
  const totalRemaining = logs.reduce((sum, l) => sum + (l.remaining || 0), 0);

  return (
    <main className="main-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Sync Logs</h1>
        <p className="page-subtitle">Indexing statistics across all buckets</p>
      </div>

      {loadingData ? (
        <div className="spinner-overlay" style={{ minHeight: "40vh" }}>
          <div className="spinner"></div>
          <span className="spinner-text">Loading sync data...</span>
        </div>
      ) : (
        <>
          {/* Live Sync Status */}
          {inProgress && syncJob && (
            <div className="alert alert-info" style={{ maxWidth: 700, marginBottom: 24 }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
              <div>
                <strong>Sync in progress</strong> — Bucket: {syncJob.bucket} |
                Processed: {syncJob.processed}/{syncJob.batch_size} |
                Status: {syncJob.status}
              </div>
            </div>
          )}

          {/* Overview Stats */}
          <div className="stats-grid" style={{ maxWidth: 700, marginBottom: 32 }}>
            <div className="stat-card" style={{ cursor: "default" }}>
              <div className="stat-card-icon">📊</div>
              <div className="stat-card-label">{totalSynced.toLocaleString()}</div>
              <div className="stat-card-desc">Total Synced</div>
            </div>
            <div className="stat-card" style={{ cursor: "default" }}>
              <div className="stat-card-icon">📁</div>
              <div className="stat-card-label">{totalFiles.toLocaleString()}</div>
              <div className="stat-card-desc">Total Files</div>
            </div>
            <div className="stat-card" style={{ cursor: "default" }}>
              <div className="stat-card-icon">⏳</div>
              <div className="stat-card-label">{totalRemaining.toLocaleString()}</div>
              <div className="stat-card-desc">Remaining</div>
            </div>
            {indexStats && (
              <div className="stat-card" style={{ cursor: "default" }}>
                <div className="stat-card-icon">🧠</div>
                <div className="stat-card-label">{indexStats.total_vectors?.toLocaleString()}</div>
                <div className="stat-card-desc">FAISS Vectors</div>
              </div>
            )}
          </div>

          {/* Per-Bucket Table */}
          <div className="card" style={{ maxWidth: 700 }}>
            <div className="card-header">
              <div className="card-title">Per-Bucket Stats</div>
            </div>

            {logs.length === 0 ? (
              <div className="alert alert-warning" style={{ margin: 0 }}>
                No sync data yet. Start indexing to see stats.
              </div>
            ) : (
              <div className="sync-table">
                <div className="sync-table-header">
                  <div>Bucket</div>
                  <div>Synced</div>
                  <div>Total</div>
                  <div>Remaining</div>
                  <div>Last Sync</div>
                </div>
                {logs.map((log, idx) => (
                  <div className="sync-table-row" key={log.bucket_name || idx}>
                    <div className="sync-table-bucket">
                      🪣 {log.bucket_name}
                    </div>
                    <div>{log.total_synced?.toLocaleString() ?? "—"}</div>
                    <div>{log.total_files?.toLocaleString() ?? "Unknown"}</div>
                    <div>
                      {log.remaining != null ? (
                        <span style={{ color: log.remaining > 0 ? "var(--warning)" : "var(--success)" }}>
                          {log.remaining.toLocaleString()}
                        </span>
                      ) : (
                        "—"
                      )}
                    </div>
                    <div>{log.last_sync_date || "Never"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            className="btn btn-secondary"
            onClick={loadAllData}
            style={{ marginTop: 20 }}
          >
            🔄 Refresh Data
          </button>
        </>
      )}
    </main>
  );
}
