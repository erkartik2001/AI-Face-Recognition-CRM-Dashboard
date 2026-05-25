/**
 * Search Face Page
 *
 * - Upload face image
 * - Animated progress bar while searching
 * - Display match results with similarity score
 */

"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function SearchFacePage() {
  const router = useRouter();
  const { loggedIn, loading, token } = useAuth();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [searching, setSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);

  const fileInputRef = useRef(null);
  const progressRef = useRef(null);

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

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setMessage(null);
      setProgress(0);
    }
  }

  function startProgressSim() {
    setProgress(0);
    let current = 0;
    progressRef.current = setInterval(() => {
      current += Math.random() * (current < 40 ? 6 : current < 70 ? 3 : 1);
      if (current >= 90) {
        current = 90;
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
      setProgress(Math.min(current, 90));
    }, 200);
  }

  function completeProgress(success) {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    setProgress(success ? 100 : 0);
  }

  async function handleSearch() {
    if (!file) return;

    setSearching(true);
    setResult(null);
    setMessage(null);
    startProgressSim();

    try {
      const response = await apiClient.searchFace(file, token);

      if (response.success === false && response._status) {
        completeProgress(false);
        setMessage({ type: "error", text: response.message || "Search failed" });
        setSearching(false);
        return;
      }

      const matches = response.matches;

      if (matches && !Array.isArray(matches)) {
        completeProgress(false);
        setMessage({ type: "error", text: matches.message || "No indexed faces found" });
      } else if (!matches || matches.length === 0) {
        completeProgress(false);
        setMessage({ type: "error", text: "No Match Found" });
      } else {
        completeProgress(true);
        const match = matches[0];
        setResult(match);
        setMessage({ type: "success", text: "Match Found!" });
      }
    } catch (err) {
      completeProgress(false);
      setMessage({ type: "error", text: "Search failed. Please try again." });
    }

    setSearching(false);
  }

  return (
    <main className="main-content fade-in">
      <style>{`
        @keyframes progressShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div className="page-header">
        <h1 className="page-title">Search Face</h1>
        <p className="page-subtitle">Upload a face image to find matches in the database</p>
      </div>

      {/* Upload Zone */}
      <div className="card" style={{ maxWidth: 700, marginBottom: 24 }}>
        <div
          className={`upload-zone ${file ? "has-file" : ""}`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
          id="upload-zone"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".jpg,.jpeg,.png"
            style={{ display: "none" }}
            id="file-input"
          />

          {!preview ? (
            <>
              <div className="upload-zone-icon">📸</div>
              <div className="upload-zone-text">Click to upload a face image</div>
              <div className="upload-zone-hint">Supports JPG, JPEG, PNG</div>
            </>
          ) : (
            <>
              <img src={preview} alt="Uploaded preview" className="preview-image" />
              <div className="upload-zone-hint" style={{ marginTop: 8 }}>
                Click to change image
              </div>
            </>
          )}
        </div>

        {file && (
          <>
            <button
              className="btn btn-primary btn-full btn-lg"
              style={{ marginTop: 20 }}
              onClick={handleSearch}
              disabled={searching}
              id="search-face-btn"
            >
              {searching ? (
                <>
                  <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                  Searching Face...
                </>
              ) : (
                "🔍 Search Face"
              )}
            </button>

            {/* Search Progress Bar */}
            {(searching || progress > 0) && (
              <div style={{ marginTop: 16 }}>
                <div className="progress-track">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${progress}%`,
                      background:
                        progress >= 100
                          ? "linear-gradient(90deg, #22c55e, #4ade80, #22c55e)"
                          : "linear-gradient(90deg, #6366f1, #818cf8, #6366f1)",
                      backgroundSize: progress >= 100 ? "100% 100%" : "200% 100%",
                      animation:
                        progress >= 100
                          ? "none"
                          : "progressShimmer 1.5s ease-in-out infinite",
                    }}
                  >
                    {progress >= 15 && (
                      <span className="progress-text">{Math.round(progress)}%</span>
                    )}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: searching ? "var(--accent-primary-hover)" : progress >= 100 ? "var(--success)" : "var(--text-muted)",
                    marginTop: 8,
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  {searching
                    ? "Analyzing face and searching database…"
                    : progress >= 100
                    ? "Search complete!"
                    : ""}
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* Match Result */}
      {result && (
        <div className="match-result success fade-in">
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="match-label">Similarity Score</div>
              <div className="match-score">{result.similarity?.toFixed(4)}</div>

              <div style={{ marginTop: 20 }}>
                <div className="match-label">File Name</div>
                <div className="match-value">{result.file_name}</div>
              </div>

              {result.bucket_name && (
                <div style={{ marginTop: 12 }}>
                  <div className="match-label">Bucket</div>
                  <div className="match-value">{result.bucket_name}</div>
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              {result.show_file_url ? (
                <>
                  <div className="match-label">Matched Face</div>
                  <img
                    src={result.show_file_url}
                    alt="Matched Face"
                    className="preview-image"
                    style={{ maxWidth: 350 }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                  <div className="alert alert-warning" style={{ display: "none" }}>
                    Image Preview Not available
                  </div>
                </>
              ) : (
                <div className="alert alert-warning">Image Preview Not available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
