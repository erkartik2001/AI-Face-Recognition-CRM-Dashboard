/**
 * API Client — aligned with backend API endpoints
 *
 * Auth:
 *   POST /login           -> { success, requires_2fa } OR { success, access_token }
 *   GET  /me              -> { username, role, exp }
 *   POST /create-user     -> { success, qr_code }
 *   POST /change-password -> { message: "Password updated" }
 *   POST /delete-user     -> { success, message }
 *   GET  /users           -> { success, users: [...] }
 *   GET  /setup-2fa/:user -> { secret, qr_url }  (requires auth)
 *
 * Search:
 *   POST /search-face     -> { success, matches: [...] }
 *
 * Indexing (non-blocking):
 *   POST /start-indexing  -> { success, message, sync_job }
 *   GET  /sync-status     -> { success, in_progress, sync_job }
 *   GET  /sync-logs       -> { success, logs: [...] }
 *
 * Buckets:
 *   GET  /buckets         -> { success, buckets: [...] }
 *   POST /add-bucket      -> { success, message }
 *   POST /set-active-bucket -> { success, message }
 *   GET  /active-bucket   -> { success, bucket_name }
 *
 * Utility:
 *   GET  /health          -> { status, ... }
 *   GET  /index-stats     -> { success, total_vectors, total_mappings }
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

class APIClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  /**
   * Shared fetch wrapper that handles HTTP errors gracefully.
   */
  async _fetch(url, options = {}) {
    try {
      const response = await fetch(url, options);
      const data = await response.json();

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

  async login(username, password, otp = null) {
    const url = `${this.baseUrl}/login`;
    return this._fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, otp }),
    });
  }

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

  async deleteUser(username, token) {
    const url = `${this.baseUrl}/delete-user`;
    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username }),
    });
  }

  async getMe(token) {
    const url = `${this.baseUrl}/me`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getUsers(token) {
    const url = `${this.baseUrl}/users`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async setup2fa(username, token) {
    const url = `${this.baseUrl}/setup-2fa/${encodeURIComponent(username)}`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // =====================================================
  // FACE SEARCH
  // =====================================================

  async searchFace(imageFile, token) {
    const url = `${this.baseUrl}/search-face`;
    const formData = new FormData();
    formData.append("file", imageFile);

    return this._fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
  }

  // =====================================================
  // INDEXING (non-blocking)
  // =====================================================

  async startIndexing(count, token, bucketName = null) {
    const url = `${this.baseUrl}/start-indexing`;
    const body = { count };
    if (bucketName) body.bucket_name = bucketName;

    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async getSyncStatus(token) {
    const url = `${this.baseUrl}/sync-status`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getSyncLogs(token) {
    const url = `${this.baseUrl}/sync-logs`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // =====================================================
  // BUCKET MANAGEMENT
  // =====================================================

  async getBuckets(token) {
    const url = `${this.baseUrl}/buckets`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async addBucket(bucketName, token) {
    const url = `${this.baseUrl}/add-bucket`;
    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucket_name: bucketName }),
    });
  }

  async setActiveBucket(bucketName, token) {
    const url = `${this.baseUrl}/set-active-bucket`;
    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ bucket_name: bucketName }),
    });
  }

  async getActiveBucket(token) {
    const url = `${this.baseUrl}/active-bucket`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // =====================================================
  // UTILITY
  // =====================================================

  async home() {
    const url = `${this.baseUrl}/`;
    return this._fetch(url);
  }

  async getHealth() {
    const url = `${this.baseUrl}/health`;
    return this._fetch(url);
  }

  async getIndexStats() {
    const url = `${this.baseUrl}/index-stats`;
    return this._fetch(url);
  }
}

const apiClient = new APIClient();
export default apiClient;
