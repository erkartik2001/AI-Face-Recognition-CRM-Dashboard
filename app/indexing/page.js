/**
 * Indexing Page
 *
 * Non-blocking indexing with real progress polling via GET /sync-status.
 * Supports bucket selection for multi-bucket indexing.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function IndexingPage() {
  const router = useRouter();
  const { loggedIn, loading, token, user } = useAuth();

  const [count, setCount] = useState(50);
  const [indexing, setIndexing] = useState(false);
  const [message, setMessage] = useState(null);
  const [syncJob, setSyncJob] = useState(null);

  // Bucket selection
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState("");
  const [loadingBuckets, setLoadingBuckets] = useState(false);

  // Polling
  const pollRef = useRef(null);

  // Load buckets on mount
  useEffect(() => {
    if (!loading && loggedIn && token && user?.role === "admin") {
      loadBuckets();
      checkExistingSync();
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loggedIn, token]);

  async function loadBuckets() {
    setLoadingBuckets(true);
    const res = await apiClient.getBuckets(token);
    if (res.success && res.buckets) {
      setBuckets(res.buckets);
      const active = res.buckets.find((b) => b.is_active);
      if (active) setSelectedBucket(active.bucket_name);
    }
    setLoadingBuckets(false);
  }

  async function checkExistingSync() {
    const res = await apiClient.getSyncStatus(token);
    if (res.success && res.in_progress && res.sync_job) {
      setIndexing(true);
      setSyncJob(res.sync_job);
      startPolling();
    }
  }

  function startPolling() {
    if (pollRef.current) clearInterval(pollRef.current);

    pollRef.current = setInterval(async () => {
      const res = await apiClient.getSyncStatus(token);
      if (res.success && res.sync_job) {
        setSyncJob(res.sync_job);

        if (!res.in_progress) {
          clearInterval(pollRef.current);
          pollRef.current = null;
          setIndexing(false);

          if (res.sync_job.status === "completed") {
            setMessage({ type: "success", text: "Indexing completed successfully!" });
          } else if (res.sync_job.status === "failed") {
            setMessage({ type: "error", text: res.sync_job.error || "Indexing failed" });
          }
        }
      }
    }, 2000);
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

  function handleCountChange(value) {
    const num = parseInt(value) || 1;
    setCount(Math.max(1, Math.min(25000, num)));
  }

  async function handleStartIndexing() {
    setIndexing(true);
    setMessage(null);
    setSyncJob(null);

    const res = await apiClient.startIndexing(count, token, selectedBucket || null);

    if (res.success === false) {
      setMessage({ type: "error", text: res.message || "Failed to start indexing" });
      setIndexing(false);
      return;
    }

    setSyncJob(res.sync_job);
    startPolling();
  }

  // Progress calculation
  const progress = syncJob
    ? syncJob.batch_size > 0
      ? Math.round(((syncJob.processed || 0) / syncJob.batch_size) * 100)
      : 0
    : 0;

  const isComplete = syncJob?.status === "completed";
  const isFailed = syncJob?.status === "failed";

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
      `}</style>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Index B2 Images</h1>
        <p className="page-subtitle">Index images from Backblaze B2 for face recognition</p>
      </div>

      {/* Indexing Card */}
      <div className="card" style={{ maxWidth: 560 }}>
        {/* Bucket Selector */}
        {user?.role === "admin" && buckets.length > 0 && (
          <div className="form-group">
            <label className="form-label" htmlFor="bucket-select">
              Select Bucket
            </label>
            <select
              id="bucket-select"
              className="form-select"
              value={selectedBucket}
              onChange={(e) => setSelectedBucket(e.target.value)}
              disabled={indexing}
            >
              {buckets.map((b) => (
                <option key={b.bucket_name} value={b.bucket_name}>
                  {b.bucket_name} {b.is_active ? "(active)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Count Input */}
        <div className="form-group">
          <label className="form-label" htmlFor="index-count">
            How many images to index?
          </label>

          <div className="number-input-group">
            <button
              className="number-btn"
              onClick={() => handleCountChange(count - 10)}
              type="button"
            >
              −
            </button>
            <input
              id="index-count"
              className="form-input"
              type="number"
              min={1}
              max={25000}
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
              style={{ flex: 1 }}
              disabled={indexing}
            />
            <button
              className="number-btn"
              onClick={() => handleCountChange(count + 10)}
              type="button"
            >
              +
            </button>
          </div>

          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 8 }}>
            Range: 1 – 25,000 images
          </p>
        </div>

        {/* Start Button */}
        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleStartIndexing}
          disabled={indexing}
          id="start-indexing-btn"
        >
          {indexing ? (
            <>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
              Indexing in Progress...
            </>
          ) : (
            "📂 Start Indexing"
          )}
        </button>

        {/* Real Progress Bar */}
        {syncJob && (
          <div style={{ marginTop: 20 }}>
            {/* Progress Track */}
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${isComplete ? 100 : isFailed ? progress : progress}%`,
                  background: isFailed
                    ? "linear-gradient(90deg, #ef4444, #dc2626)"
                    : isComplete
                      ? "linear-gradient(90deg, #22c55e, #4ade80, #22c55e)"
                      : "linear-gradient(90deg, #6366f1, #818cf8, #6366f1)",
                  backgroundSize: isComplete || isFailed ? "100% 100%" : "200% 100%",
                  animation: isComplete || isFailed ? "none" : "progressShimmer 1.5s ease-in-out infinite",
                }}
              >
                {(isComplete ? 100 : progress) >= 15 && (
                  <span className="progress-text">
                    {isComplete ? 100 : progress}%
                  </span>
                )}
              </div>
            </div>

            {/* Progress Stats */}
            <div className="progress-stats">
              <span>
                {syncJob.processed || 0} / {syncJob.batch_size || "?"} processed
              </span>
              {syncJob.skipped > 0 && (
                <span style={{ color: "var(--warning)" }}>
                  {syncJob.skipped} skipped
                </span>
              )}
              <span>Bucket: {syncJob.bucket || "—"}</span>
            </div>

            {/* Status Box */}
            <div className={`sync-status-box ${isComplete ? "complete" : isFailed ? "failed" : "running"}`}>
              {indexing ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: 16, height: 16, borderWidth: 2 }}
                  ></div>
                  <span>Indexing in progress — polling live status…</span>
                </>
              ) : isComplete ? (
                <>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span>Indexing completed!</span>
                </>
              ) : isFailed ? (
                <>
                  <span style={{ fontSize: 18 }}>❌</span>
                  <span>Indexing failed: {syncJob.error}</span>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 20, maxWidth: 560 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Completed Response */}
      {syncJob && isComplete && (
        <div className="card fade-in" style={{ maxWidth: 560, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Sync Result</div>
          </div>
          <div className="sync-result-grid">
            <div className="sync-result-item">
              <div className="sync-result-label">Processed</div>
              <div className="sync-result-value">{syncJob.processed}</div>
            </div>
            <div className="sync-result-item">
              <div className="sync-result-label">Skipped</div>
              <div className="sync-result-value">{syncJob.skipped || 0}</div>
            </div>
            <div className="sync-result-item">
              <div className="sync-result-label">Total Files</div>
              <div className="sync-result-value">{syncJob.total_files || "—"}</div>
            </div>
            <div className="sync-result-item">
              <div className="sync-result-label">Remaining</div>
              <div className="sync-result-value">{syncJob.remaining ?? "—"}</div>
            </div>
            <div className="sync-result-item">
              <div className="sync-result-label">Bucket</div>
              <div className="sync-result-value">{syncJob.bucket}</div>
            </div>
            <div className="sync-result-item">
              <div className="sync-result-label">Completed At</div>
              <div className="sync-result-value">{syncJob.completed_at || "—"}</div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
