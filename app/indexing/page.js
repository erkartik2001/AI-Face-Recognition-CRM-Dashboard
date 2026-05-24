/**
 * Indexing Page
 *
 * Replica of: frontend/pages/indexing.py
 *
 * - Number input for how many images to index
 * - Start indexing button
 * - Shows "Indexing Started" success + full response from server
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function IndexingPage() {
  const router = useRouter();
  const { loggedIn, loading, token } = useAuth();

  const [count, setCount] = useState(50);
  const [indexing, setIndexing] = useState(false);
  const [message, setMessage] = useState(null);
  const [response, setResponse] = useState(null);

  // Progress bar state
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const intervalRef = useRef(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

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

  function handleCountChange(value) {
    const num = parseInt(value) || 1;
    setCount(Math.max(1, Math.min(5000, num)));
  }

  function startProgressSimulation() {
    setProgress(0);
    setShowProgress(true);

    let current = 0;
    intervalRef.current = setInterval(() => {
      // Slow down as we approach 90% to simulate realistic progress
      current += Math.random() * (current < 50 ? 4 : current < 75 ? 2 : 0.5);
      if (current >= 90) {
        current = 90;
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setProgress(Math.min(current, 90));
    }, 300);
  }

  function completeProgress() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setProgress(100);
  }

  async function handleStartIndexing() {
    setIndexing(true);
    setMessage(null);
    setResponse(null);

    // Start the simulated progress bar
    startProgressSimulation();

    try {
      const res = await apiClient.startIndexing(count, token);

      // Complete the progress bar to 100%
      completeProgress();

      // HTTP error (403 Admin only, etc.)
      if (res.success === false) {
        setMessage({ type: "error", text: res.message || "Indexing failed" });
      } else {
        setMessage({ type: "success", text: "Indexing Completed" });
        setResponse(res);
      }
    } catch (err) {
      completeProgress();
      setMessage({ type: "error", text: "Indexing failed. Please try again." });
    }

    setIndexing(false);
  }

  const progressBarContainerStyle = {
    width: "100%",
    height: 22,
    backgroundColor: "var(--bg-tertiary, #2a2a3d)",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 16,
    border: "1px solid var(--border-color, rgba(255,255,255,0.08))",
  };

  const progressBarFillStyle = {
    height: "100%",
    width: `${progress}%`,
    background: progress < 100
      ? "linear-gradient(90deg, #6366f1, #818cf8, #6366f1)"
      : "linear-gradient(90deg, #22c55e, #4ade80, #22c55e)",
    backgroundSize: "200% 100%",
    animation: progress < 100 ? "progressShimmer 1.5s ease-in-out infinite" : "none",
    borderRadius: 12,
    transition: "width 0.4s ease, background 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const progressTextStyle = {
    fontSize: 11,
    fontWeight: 700,
    color: "#fff",
    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
    minWidth: 40,
    textAlign: "center",
  };

  const statusBoxStyle = {
    marginTop: 14,
    padding: "12px 16px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 14,
    fontWeight: 500,
    background: indexing
      ? "rgba(99,102,241,0.1)"
      : "rgba(34,197,94,0.1)",
    border: indexing
      ? "1px solid rgba(99,102,241,0.25)"
      : "1px solid rgba(34,197,94,0.25)",
    color: indexing
      ? "var(--primary, #818cf8)"
      : "#4ade80",
  };

  return (
    <main className="main-content fade-in">
      {/* Shimmer keyframe for progress bar */}
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
      <div className="card" style={{ maxWidth: 500 }}>
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
              max={5000}
              value={count}
              onChange={(e) => handleCountChange(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="number-btn"
              onClick={() => handleCountChange(count + 10)}
              type="button"
            >
              +
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              marginTop: 8,
            }}
          >
            Range: 1 – 5,000 images
          </p>
        </div>

        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleStartIndexing}
          disabled={indexing}
          id="start-indexing-btn"
        >
          {indexing ? (
            <>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
              Indexing Images...
            </>
          ) : (
            "📂 Start Indexing"
          )}
        </button>

        {/* Progress Bar — visible during and after indexing */}
        {showProgress && (
          <div style={{ marginTop: 20 }}>
            {/* Progress bar track */}
            <div style={progressBarContainerStyle}>
              <div style={progressBarFillStyle}>
                {progress >= 15 && (
                  <span style={progressTextStyle}>{Math.round(progress)}%</span>
                )}
              </div>
            </div>

            {/* Percentage below bar when too small to show inside */}
            {progress < 15 && (
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>
                {Math.round(progress)}%
              </p>
            )}

            {/* Status message */}
            <div style={statusBoxStyle}>
              {indexing ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: 16, height: 16, borderWidth: 2, animation: "pulseGlow 1.5s infinite, spin 0.8s linear infinite" }}
                  ></div>
                  <span>Indexing started — please wait…</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 18 }}>✅</span>
                  <span>Indexing completed!</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 20, maxWidth: 500 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Response Data - Streamlit does st.write(response) showing full response */}
      {response && (
        <div className="card fade-in" style={{ maxWidth: 500, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">Response</div>
          </div>
          <pre
            style={{
              fontSize: 13,
              color: "var(--text-secondary)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
