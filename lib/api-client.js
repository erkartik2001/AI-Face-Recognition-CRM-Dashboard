/**
 * HANDLES:
 *
 * - Backend API Requests
 * - JWT Token Headers
 * - ALL HTTP Communication
 *
 * Aligned with backend API response formats:
 *
 * POST /login           -> { success, requires_2fa } OR { success, access_token } OR HTTPException 401
 * GET  /me              -> { username, role, exp }  (JWT payload)
 * POST /create-user     -> { success, qr_code } OR HTTPException 400/403
 * POST /change-password -> { message: "Password updated" } OR HTTPException 403
 * GET  /users           -> { success, users: [...] } OR { success: false, message }
 * POST /search-face     -> { success, matches: [...] }  (no auth required on backend)
 * POST /start-indexing  -> { success, message } OR HTTPException 403
 * GET  /setup-2fa/:user -> { secret, qr_url } OR HTTPException 404
 * GET  /                -> { message: "AI Face Recognition API Running" }
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

class APIClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * Shared fetch wrapper that handles HTTP errors gracefully.
   * Backend uses HTTPException for errors (401, 403, 404, etc.)
   * which returns { "detail": "error message" }.
   * This wrapper converts those into a consistent response object
   * instead of letting response.json() silently return the error.
   */
  async _fetch(url, options = {}) {
    try {
      const response = await fetch(url, options);

      const data = await response.json();

      // If backend returned an HTTP error (401, 403, 404, etc.)
      // FastAPI returns { "detail": "..." }
      if (!response.ok) {
        return {
          success: false,
          message: data.detail || `Error ${response.status}`,
          _status: response.status,
        };
      }

      return data;
    } catch (err) {
      return {
        success: false,
        message: "Connection error. Backend may be offline.",
        _networkError: true,
      };
    }
  }

  // =====================================================
  // AUTH APIs
  // =====================================================

  /**
   * POST /login
   *
   * Request:  { username, password, otp? }
   * Response (step 1): { success: true, requires_2fa: true }
   * Response (step 2): { success: true, access_token: "..." }
   * Error:   HTTPException 401 -> { detail: "Invalid credentials" }
   * Error:   HTTPException 401 -> { detail: "Invalid OTP" }
   */
  async login(username, password, otp = null) {
    const url = `${this.baseUrl}/login`;

    const payload = { username, password, otp };

    return this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  /**
   * POST /create-user
   *
   * Request:  { username, password, role }
   * Headers:  Authorization: Bearer <token>
   * Response: { success: true, qr_code: "base64..." }
   * Error:    HTTPException 403 -> { detail: "Admin only" }
   * Error:    HTTPException 400 -> { detail: "Username already exists" }
   */
  async createUser(username, password, role, token) {
    const url = `${this.baseUrl}/create-user`;

    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password, role }),
    });
  }

  /**
   * POST /change-password
   *
   * Request:  { username, new_password }
   * Headers:  Authorization: Bearer <token>
   * Response: { message: "Password updated" }   (NOTE: no "success" field!)
   * Error:    HTTPException 403 -> { detail: "Admin only" }
   */
  async changePassword(username, newPassword, token) {
    const url = `${this.baseUrl}/change-password`;

    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, new_password: newPassword }),
    });
  }

  /**
   * GET /me
   *
   * Headers:  Authorization: Bearer <token>
   * Response: { username: "...", role: "...", exp: 123456 }
   *           (This is the JWT payload, NOT a full user object)
   * Error:    HTTPException 401 -> { detail: "Invalid token" }
   */
  async getMe(token) {
    const url = `${this.baseUrl}/me`;

    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // =====================================================
  // FACE SEARCH APIs
  // =====================================================

  /**
   * POST /search-face
   *
   * Body:     FormData with "file" field
   * NOTE:     Backend does NOT require auth for this route!
   * Response: { success: true, matches: [{ file_name, file_url, show_file_url, similarity }] }
   */
  async searchFace(imageFile, token) {
    const url = `${this.baseUrl}/search-face`;

    const formData = new FormData();
    formData.append("file", imageFile);

    // Backend search_routes.py does NOT use Depends(get_current_user)
    // but we still send the token in case it's added later
    return this._fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  }


  // =====================================================
  // INDEXING APIs
  // =====================================================

  /**
   * POST /start-indexing
   *
   * Request:  { count: int }
   * Headers:  Authorization: Bearer <token>
   * Response: { success: true, message: "Indexing started" }
   * Error:    HTTPException 403 -> { detail: "Admin only" }
   */
  async startIndexing(count, token) {
    const url = `${this.baseUrl}/start-indexing`;

    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ count }),
    });
  }

  // =====================================================
  // HOME API
  // =====================================================

  /**
   * GET /
   * Response: { message: "AI Face Recognition API Running" }
   */
  async home() {
    const url = `${this.baseUrl}/`;
    return this._fetch(url);
  }

  /**
   * GET /setup-2fa/{username}
   *
   * Response: { secret: "...", qr_url: "otpauth://..." }
   * Error:    HTTPException 404 -> { detail: "User not found" }
   */
  async setup2fa(username) {
    const url = `${this.baseUrl}/setup-2fa/${encodeURIComponent(username)}`;
    return this._fetch(url);
  }

  // -----------------------------
  // GET USERS
  // -----------------------------

  /**
   * GET /users
   *
   * Headers:  Authorization: Bearer <token>
   * Response: { success: true, users: [{ username, role, created_at, last_login }] }
   *           NOTE: No "is_active" field in response!
   * Error:    { success: false, message: "Admin only" }
   */
  async getUsers(token) {
    const url = `${this.baseUrl}/users`;

    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

// Singleton instance
const apiClient = new APIClient();

export default apiClient;
