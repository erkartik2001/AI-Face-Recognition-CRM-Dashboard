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

import { useState } from "react";
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

  async function handleStartIndexing() {
    setIndexing(true);
    setMessage(null);
    setResponse(null);

    try {
      const res = await apiClient.startIndexing(count, token);

      // HTTP error (403 Admin only, etc.)
      if (res.success === false) {
        setMessage({ type: "error", text: res.message || "Indexing failed" });
      } else {
        // Streamlit shows "Indexing Started" success THEN the full response
        setMessage({ type: "success", text: "Indexing Started" });
        setResponse(res);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Indexing failed. Please try again." });
    }

    setIndexing(false);
  }

  return (
    <main className="main-content fade-in">
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
