/**
 * Login Page (Home)
 *
 * Replica of: frontend/pages/login.py
 *
 * - Login form with username/password
 * - OTP verification for 2FA
 * - Redirects to dashboard if already logged in
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import apiClient from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const { loggedIn, loading, saveLogin, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Loading state
  if (loading) {
    return (
      <main className="main-content no-sidebar">
        <div className="login-container">
          <div className="spinner-overlay">
            <div className="spinner"></div>
            <span className="spinner-text">Loading...</span>
          </div>
        </div>
      </main>
    );
  }

  // Already logged in
  if (loggedIn) {
    return (
      <main className="main-content no-sidebar">
        <div className="login-container">
          <div className="login-card">
            <div className="login-brand">
              <div className="login-brand-icon">🧠</div>
              <div className="login-brand-title">AI Face CRM</div>
              <div className="login-brand-subtitle">Already Logged In</div>
            </div>

            <div className="alert alert-success">✅ You are already logged in</div>

            <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => router.push("/dashboard")}
                id="go-to-dashboard-btn"
              >
                📊 Go to Dashboard
              </button>

              <button
                className="btn btn-danger btn-full"
                onClick={() => {
                  logout();
                  window.location.reload();
                }}
                id="logout-btn"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Login handler
  async function handleLogin(e) {
    e.preventDefault();
    setMessage(null);

    if (!username || !password) {
      setMessage({ type: "error", text: "Please fill all fields" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiClient.login(username, password);

      // HTTP error (401 Invalid credentials, etc.)
      if (response.success === false) {
        setMessage({ type: "error", text: response.message || "Login Failed" });
        setSubmitting(false);
        return;
      }

      // STEP 1: Password correct -> ask OTP
      if (response.requires_2fa) {
        setTempUsername(username);
        setTempPassword(password);
        setShowOtp(true);
        setMessage({ type: "info", text: "Enter your Google Authenticator OTP" });
      }
      // FINAL LOGIN (has access_token)
      else if (response.access_token) {
        const token = response.access_token;
        // /me returns JWT payload: { username, role, exp }
        const userData = await apiClient.getMe(token);
        if (userData.success === false) {
          setMessage({ type: "error", text: "Failed to get user data" });
          setSubmitting(false);
          return;
        }
        saveLogin(token, userData);
        setMessage({ type: "success", text: "Login Successful!" });
        router.push("/dashboard");
      } else {
        setMessage({ type: "error", text: "Login Failed" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Connection error. Please try again." });
    }

    setSubmitting(false);
  }

  // OTP verification handler
  async function handleVerifyOtp() {
    setMessage(null);

    if (!otp) {
      setMessage({ type: "error", text: "Please enter OTP" });
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiClient.login(tempUsername, tempPassword, otp);

      // HTTP error (401 Invalid OTP, etc.)
      if (response.success === false) {
        setMessage({ type: "error", text: response.message || "Invalid OTP" });
        setSubmitting(false);
        return;
      }

      if (response.access_token) {
        const token = response.access_token;
        // /me returns JWT payload: { username, role, exp }
        const userData = await apiClient.getMe(token);
        if (userData.success === false) {
          setMessage({ type: "error", text: "Failed to get user data" });
          setSubmitting(false);
          return;
        }
        saveLogin(token, userData);
        setMessage({ type: "success", text: "Login Successful!" });
        router.push("/dashboard");
      } else {
        setMessage({ type: "error", text: "Invalid OTP" });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Verification failed. Try again." });
    }

    setSubmitting(false);
  }

  return (
    <main className="main-content no-sidebar">
      <div className="login-container">
        <div className="login-card">
          {/* Brand */}
          <div className="login-brand">
            <div className="login-brand-icon">🧠</div>
            <div className="login-brand-title">AI Face Recognition CRM</div>
            <div className="login-brand-subtitle">Sign in to your account</div>
          </div>

          {/* Message */}
          {message && (
            <div className={`alert alert-${message.type}`}>
              {message.type === "success" && "✅ "}
              {message.type === "error" && "❌ "}
              {message.type === "info" && "ℹ️ "}
              {message.text}
            </div>
          )}

          {/* Login Form */}
          {!showOtp && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  className="form-input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  className="form-input"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={submitting}
                id="login-btn"
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                    Logging in...
                  </>
                ) : (
                  "🔐 Login"
                )}
              </button>
            </form>
          )}

          {/* OTP Screen */}
          {showOtp && (
            <div className="fade-in">
              <h3 style={{ marginBottom: 16, fontSize: 16, color: "var(--text-primary)" }}>
                🛡️ Enter Google Authenticator OTP
              </h3>

              <div className="form-group">
                <label className="form-label" htmlFor="otp">
                  OTP Code
                </label>
                <input
                  id="otp"
                  className="form-input"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={{ textAlign: "center", fontSize: 20, letterSpacing: 8 }}
                />
              </div>

              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={handleVerifyOtp}
                disabled={submitting}
                id="verify-otp-btn"
              >
                {submitting ? (
                  <>
                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></div>
                    Verifying...
                  </>
                ) : (
                  "✅ Verify OTP"
                )}
              </button>

              <button
                className="btn btn-secondary btn-full"
                style={{ marginTop: 12 }}
                onClick={() => {
                  setShowOtp(false);
                  setOtp("");
                  setMessage(null);
                }}
                id="back-to-login-btn"
              >
                ← Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
