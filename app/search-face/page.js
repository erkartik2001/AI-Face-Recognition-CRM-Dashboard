/**
 * Search Face Page
 *
 * Replica of: frontend/pages/search_face.py
 *
 * - Upload face image
 * - Search for matching faces
 * - Display match result with similarity score and matched image
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
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);

  const fileInputRef = useRef(null);

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

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult(null);
      setMessage(null);
    }
  }

  async function handleSearch() {
    if (!file) return;

    setSearching(true);
    setResult(null);
    setMessage(null);

    try {
      const response = await apiClient.searchFace(file, token);

      // HTTP error
      if (response.success === false && response._status) {
        setMessage({ type: "error", text: response.message || "Search failed" });
        setSearching(false);
        return;
      }

      const matches = response.matches;

      // matcher.search() can return a dict { success: false, message: "No indexed faces found" }
      // instead of an array when there's no FAISS index
      if (matches && !Array.isArray(matches)) {
        setMessage({ type: "error", text: matches.message || "No indexed faces found" });
      } else if (!matches || matches.length === 0) {
        setMessage({ type: "error", text: "No Match Found" });
      } else {
        const match = matches[0];
        setResult(match);
        setMessage({ type: "success", text: "Match Found!" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Search failed. Please try again." });
    }

    setSearching(false);
  }

  return (
    <main className="main-content fade-in">
      {/* Page Header */}
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
            {/* Score & Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div className="match-label">Similarity Score</div>
              <div className="match-score">{result.similarity?.toFixed(4)}</div>

              <div style={{ marginTop: 20 }}>
                <div className="match-label">File Name</div>
                <div className="match-value">{result.file_name}</div>
              </div>
            </div>

            {/* Matched Image */}
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
