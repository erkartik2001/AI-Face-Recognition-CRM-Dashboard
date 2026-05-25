/**
 * Setup 2FA Page
 *
 * - Enter username
 * - Generate QR code for Google Authenticator
 * - Shows secret key
 *
 * NOTE: Backend now requires auth. Admin can setup any user,
 *       regular users can only setup their own.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function Setup2FAPage() {
  const router = useRouter();
  const { loggedIn, loading, token, user } = useAuth();

  const [username, setUsername] = useState("");
  const [generating, setGenerating] = useState(false);
  const [qrUrl, setQrUrl] = useState(null);
  const [secret, setSecret] = useState(null);
  const [message, setMessage] = useState(null);

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

  async function handleGenerateQR() {
    const target = username || user?.username;
    if (!target) {
      setMessage({ type: "error", text: "Please enter a username" });
      return;
    }

    setGenerating(true);
    setMessage(null);
    setQrUrl(null);
    setSecret(null);

    try {
      const response = await apiClient.setup2fa(target, token);

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
        setMessage({ type: "error", text: "Failed to generate QR" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Failed to generate QR code" });
    }

    setGenerating(false);
  }

  return (
    <main className="main-content fade-in">
      <div className="page-header">
        <h1 className="page-title">Setup Google Authenticator</h1>
        <p className="page-subtitle">Generate 2FA QR code for a user</p>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="setup-username">
            Username
          </label>
          <input
            id="setup-username"
            className="form-input"
            type="text"
            placeholder={user?.username || "Enter username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          {user?.role !== "admin" && (
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
              You can only generate QR for your own account.
            </p>
          )}
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

      {message && (
        <div className={`alert alert-${message.type}`} style={{ marginTop: 20, maxWidth: 500 }}>
          {message.type === "success" ? "✅" : "❌"} {message.text}
        </div>
      )}

      {qrUrl && (
        <div className="card fade-in" style={{ maxWidth: 500, marginTop: 16 }}>
          <div className="card-header">
            <div className="card-title">🛡️ Google Authenticator Setup</div>
          </div>

          <div className="qr-container">
            <div className="qr-code-img">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}`}
                alt="2FA QR Code"
              />
            </div>

            <p style={{ marginTop: 12, fontSize: 13, color: "var(--text-muted)" }}>
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
