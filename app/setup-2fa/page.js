/**
 * Setup 2FA Page
 *
 * Replica of: frontend/utils/setup_2fa.py
 *
 * - Enter username
 * - Generate QR code for Google Authenticator
 * - Shows secret key
 *
 * NOTE: The original Streamlit version has NO auth check.
 *       It is a standalone utility accessible to anyone.
 */

"use client";

import { useState } from "react";
import apiClient from "@/lib/api-client";

export default function Setup2FAPage() {
  const [username, setUsername] = useState("");
  const [generating, setGenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [message, setMessage] = useState(null);

  async function handleGenerateQR() {
    if (!username) {
      setMessage({ type: "error", text: "Please enter a username" });
      return;
    }

    setGenerating(true);
    setMessage(null);
    setQrUrl(null);
    setSecret(null);

    try {
      const response = await apiClient.setup2fa(username);

      // HTTP error (404 User not found, etc.)
      if (response.success === false) {
        setMessage({
          type: "error",
          text: response.message || "Failed to generate QR",
        });
      } else if (response.qr_url) {
        setQrUrl(response.qr_url);
        setSecret(response.secret);
        setMessage({ type: "success", text: "QR Code generated successfully" });
      } else {
        setMessage({
          type: "error",
          text: "Failed to generate QR",
        });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate QR code" });
    }

    setGenerating(false);
  }

  return (
    <main className="main-content fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Setup Google Authenticator</h1>
        <p className="page-subtitle">Generate 2FA QR code for a user</p>
      </div>

      {/* Form Card */}
      <div className="card" style={{ maxWidth: 500 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="setup-username">
            Username
          </label>
          <input
            id="setup-username"
            className="form-input"
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <button
          className="btn btn-primary btn-full btn-lg"
          onClick={handleGenerateQR}
          disabled={generating}
          id="generate-qr-btn"
        >
          {generating ? (
            <>
              <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
              Generating...
            </>
          ) : (
            "🛡️ Generate QR"
          )}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 20, maxWidth: 500 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {/* QR Code & Secret */}
      {qrUrl && (
        <div className="card fade-in" style={{ maxWidth: 500, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">🛡️ Google Authenticator Setup</div>
          </div>

          <div className="qr-container">
            {/* Using a QR code API to render the QR URL */}
            <div className="qr-code-img">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="2FA QR Code"
              />
            </div>

            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: "var(--text-muted)",
              }}
            >
              Scan this QR code with Google Authenticator
            </p>
          </div>

          {secret && (
            <>
              <hr className="divider" />
              <div>
                <div className="form-label">Secret Key (Manual Entry)</div>
                <div className="secret-code">{secret}</div>
              </div>
            </>
          )}
        </div>
      )}
    </main>
  );
}
