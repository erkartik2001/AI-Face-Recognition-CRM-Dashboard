/**
 * Indexing Page — Scheduler Control Panel
 *
 * Start/stop the automated indexing scheduler.
 * View live batch progress and scheduler batch history.
 * The scheduler automatically indexes all registered buckets
 * in batches of 5000 images at a time.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function IndexingPage() {
  const router = useRouter();
  const { loggedIn, loading, token, user } = useAuth();

  // Scheduler state
  const [scheduler, setScheduler] = useState(null);
  const [syncJob, setSyncJob] = useState(null);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [schedulerLogs, setSchedulerLogs] = useState([]);
  const [message, setMessage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Polling
  const pollRef = useRef(null);

  // Load data on mount
  useEffect(() => {
    if (!loading && loggedIn && token && user?.role === "admin") {
      fetchSchedulerStatus();
      fetchSchedulerLogs();
      startPolling();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loggedIn, token]);

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      await fetchSchedulerStatus();
    }, 3000);
  }

  async function fetchSchedulerStatus() {
    const res = await apiClient.getSchedulerStatus(token);
    if (res.success !== false) {
      setScheduler(res.scheduler || null);
      setSyncJob(res.sync_job || null);
      setSyncInProgress(res.sync_in_progress || false);
    }
  }

  async function fetchSchedulerLogs() {
    const res = await apiClient.getSchedulerLogs(token);
    if (res.success && res.logs) {
      setSchedulerLogs(res.logs);
    }
  }

  async function handleStart() {
    setActionLoading(true);
    setMessage(null);
    const res = await apiClient.startScheduler(token);
    if (res.success) {
      setMessage({ type: "success", text: "Scheduler started!" });
      setScheduler(res.scheduler || null);
    } else {
      setMessage({ type: "error", text: res.message || "Failed to start scheduler" });
    }
    setActionLoading(false);
  }

  async function handleStop() {
    setActionLoading(true);
    setMessage(null);
    const res = await apiClient.stopScheduler(token);
    if (res.success) {
      setMessage({ type: "success", text: "Scheduler stopped." });
      setScheduler(res.scheduler || null);
    } else {
      setMessage({ type: "error", text: res.message || "Failed to stop scheduler" });
    }
    setActionLoading(false);
    fetchSchedulerLogs();
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

  const isRunning = scheduler?.status === "running";
  const currentBatch = scheduler?.current_batch;

  // Calculate progress for the current batch
  const batchProgress = syncJob
    ? syncJob.batch_size > 0
      ? Math.round(((syncJob.processed || 0) / syncJob.batch_size) * 100)
      : 0
    : 0;

  return (
    <main className="main-content fade-in">
      <style>{`
        @keyframes progressShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes liveDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.6; }
        }
        .scheduler-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .scheduler-status-badge.running {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        .scheduler-status-badge.stopped {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.25);
        }
        .scheduler-status-badge .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
        }
        .scheduler-status-badge.running .dot {
          animation: liveDot 1.5s ease-in-out infinite;
        }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 12px;
          margin-top: 16px;
        }
        .stat-card {
          background: var(--bg-card, rgba(30,30,40,0.6));
          border: 1px solid var(--border, rgba(255,255,255,0.08));
          border-radius: 10px;
          padding: 14px;
          text-align: center;
        }
        .stat-card .label {
          font-size: 11px;
          color: var(--text-muted, #888);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .stat-card .value {
          font-size: 20px;
          font-weight: 700;
          color: var(--text-primary, #fff);
        }
        .log-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
          font-size: 13px;
        }
        .log-table th, .log-table td {
          padding: 10px 12px;
          text-align: left;
          border-bottom: 1px solid var(--border, rgba(255,255,255,0.06));
        }
        .log-table th {
          color: var(--text-muted, #888);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .log-table tr:hover td {
          background: rgba(255,255,255,0.03);
        }
        .status-pill {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .status-pill.completed {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .status-pill.running {
          background: rgba(99, 102, 241, 0.15);
          color: #818cf8;
        }
        .status-pill.failed {
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
        }
        .status-pill.no_work {
          background: rgba(234, 179, 8, 0.12);
          color: #fbbf24;
        }
        .btn-group-scheduler {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Indexing Scheduler</h1>
        <p className="page-subtitle">
          Automated face indexing — processes all registered buckets in batches of 5,000
        </p>
      </div>

      {/* Scheduler Control Card */}
      <div className="card" style={{ maxWidth: 620 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div className="card-title">Scheduler Control</div>
          <div className={`scheduler-status-badge ${isRunning ? "running" : "stopped"}`}>
            <span className="dot"></span>
            {isRunning ? "Running" : "Stopped"}
          </div>
        </div>

        {/* Scheduler Info */}
        {scheduler && (
          <div className="stat-grid">
            <div className="stat-card">
              <div className="label">Batches Done</div>
              <div className="value">{scheduler.total_batches_completed || 0}</div>
            </div>
            <div className="stat-card">
              <div className="label">Batch Size</div>
              <div className="value">{(scheduler.batch_size || 5000).toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="label">Interval</div>
              <div className="value">{scheduler.interval_seconds || 120}s</div>
            </div>
            <div className="stat-card">
              <div className="label">Started At</div>
              <div className="value" style={{ fontSize: 13 }}>{scheduler.started_at || "—"}</div>
            </div>
          </div>
        )}

        {/* Current Batch Progress */}
        {syncInProgress && syncJob && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>
              Processing: <strong>{syncJob.bucket || "—"}</strong>
            </div>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${batchProgress}%`,
                  background: "linear-gradient(90deg, #6366f1, #818cf8, #6366f1)",
                  backgroundSize: "200% 100%",
                  animation: "progressShimmer 1.5s ease-in-out infinite",
                }}
              >
                {batchProgress >= 15 && (
                  <span className="progress-text">{batchProgress}%</span>
                )}
              </div>
            </div>

            <div className="progress-stats">
              <span>{syncJob.processed || 0} / {syncJob.batch_size || "?"} processed</span>
              {syncJob.skipped > 0 && (
                <span style={{ color: "var(--warning)" }}>{syncJob.skipped} skipped</span>
              )}
            </div>
          </div>
        )}

        {/* Current batch idle status */}
        {isRunning && !syncInProgress && currentBatch && (
          <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", fontSize: 13, color: "var(--text-muted)" }}>
            {currentBatch.status === "idle" ? (
              <span>💤 {currentBatch.message || "Waiting for next cycle..."}</span>
            ) : (
              <span>Last batch: {currentBatch.bucket} — {currentBatch.processed || 0} processed</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="btn-group-scheduler">
          {!isRunning ? (
            <button
              className="btn btn-primary btn-lg"
              onClick={handleStart}
              disabled={actionLoading}
              id="start-scheduler-btn"
              style={{ flex: 1 }}
            >
              {actionLoading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  Starting...
                </>
              ) : (
                "▶ Start Scheduler"
              )}
            </button>
          ) : (
            <button
              className="btn btn-lg"
              onClick={handleStop}
              disabled={actionLoading}
              id="stop-scheduler-btn"
              style={{
                flex: 1,
                background: "rgba(239, 68, 68, 0.15)",
                color: "#f87171",
                border: "1px solid rgba(239, 68, 68, 0.3)"
              }}
            >
              {actionLoading ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  Stopping...
                </>
              ) : (
                "⏹ Stop Scheduler"
              )}
            </button>
          )}

          <button
            className="btn btn-lg"
            onClick={() => { fetchSchedulerLogs(); fetchSchedulerStatus(); }}
            style={{
              background: "rgba(99, 102, 241, 0.12)",
              color: "#818cf8",
              border: "1px solid rgba(99, 102, 241, 0.2)"
            }}
            title="Refresh status and logs"
          >
            🔄
          </button>
        </div>

        {/* Error display */}
        {scheduler?.last_error && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            ⚠️ Last Error: {scheduler.last_error}
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 16, maxWidth: 620 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Scheduler Batch History */}
      <div className="card" style={{ maxWidth: 820, marginTop: 20 }}>
        <div className="card-header">
          <div className="card-title">Batch History</div>
        </div>

        {schedulerLogs.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-muted)", fontSize: 14 }}>
            No batches processed yet. Start the scheduler to begin indexing.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="log-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Bucket</th>
                  <th>Status</th>
                  <th>Processed</th>
                  <th>Skipped</th>
                  <th>Started</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {schedulerLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: "var(--text-muted)" }}>{log.id}</td>
                    <td>{log.bucket_name}</td>
                    <td>
                      <span className={`status-pill ${log.status}`}>
                        {log.status === "no_work" ? "up to date" : log.status}
                      </span>
                    </td>
                    <td>{log.processed}</td>
                    <td>{log.skipped}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{log.started_at || "—"}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{log.completed_at || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
