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
 * Scheduler (automated indexing):
 *   POST /scheduler/start  -> { success, message, scheduler }
 *   POST /scheduler/stop   -> { success, message, scheduler }
 *   GET  /scheduler/status  -> { success, scheduler, sync_in_progress, sync_job }
 *   GET  /scheduler/logs    -> { success, logs: [...] }
 *   GET  /sync-status       -> { success, in_progress, sync_job }
 *   GET  /sync-logs         -> { success, logs: [...] }
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
  // INDEXING — SCHEDULER
  // =====================================================

  async startScheduler(token, batchSize = null, intervalSeconds = null) {
    const url = `${this.baseUrl}/scheduler/start`;
    const body = {};
    if (batchSize !== null) body.batch_size = batchSize;
    if (intervalSeconds !== null) body.interval_seconds = intervalSeconds;

    return this._fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }

  async stopScheduler(token) {
    const url = `${this.baseUrl}/scheduler/stop`;
    return this._fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getSchedulerStatus(token) {
    const url = `${this.baseUrl}/scheduler/status`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getSchedulerLogs(token) {
    const url = `${this.baseUrl}/scheduler/logs`;
    return this._fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
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
