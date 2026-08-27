const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");
const path = require("path");
const fs = require("fs");

/**
 * FCM Client — optional. Server starts even if Firebase is not configured.
 * Set FIREBASE_PROJECT_ID and either:
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account.json
 * or place a service-account JSON and set FIREBASE_CREDENTIALS_PATH.
 */

function resolveCredentialsPath() {
  const fromEnv =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_CREDENTIALS_PATH;
  if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;

  // Optional: pick a local *firebase-adminsdk*.json next to the server (never commit it)
  try {
    const root = path.join(__dirname, "..");
    const match = fs
      .readdirSync(root)
      .find((name) => /firebase-adminsdk.*\.json$/i.test(name));
    if (match) return path.join(root, match);
  } catch {
    // ignore
  }
  return null;
}

function buildGoogleAuthOptions() {
  const options = {
    scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
  };

  const keyFile = resolveCredentialsPath();
  if (keyFile) {
    options.keyFile = keyFile;
  }

  return options;
}

class FCMClient {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID || null;
    this.enabled = Boolean(this.projectId && resolveCredentialsPath());
    this.auth = this.enabled ? new GoogleAuth(buildGoogleAuthOptions()) : null;

    if (!this.enabled) {
      console.warn(
        "[FCM] Disabled — set FIREBASE_PROJECT_ID and GOOGLE_APPLICATION_CREDENTIALS (path to service-account JSON) to enable push."
      );
    }
  }

  async sendNotification({ token, title, body, data = {} }) {
    if (!this.enabled) {
      return {
        success: false,
        skipped: true,
        error: "FCM is not configured",
      };
    }

    if (!token) throw new Error("Device token is required");
    if (!title) throw new Error("Notification title is required");
    if (!body) throw new Error("Notification body is required");

    try {
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();

      if (!accessToken.token) {
        throw new Error("Failed to obtain OAuth2 access token");
      }

      const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;

      const payload = {
        message: {
          token,
          notification: { title, body },
          data,
        },
      };

      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${accessToken.token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      return {
        success: true,
        messageId: response.data.name,
        response: response.data,
      };
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.error?.message || "Unknown FCM error";
        throw new Error(`FCM API error ${status}: ${message}`);
      }
      if (error.request) {
        throw new Error("No response received from FCM server");
      }
      throw new Error(`Request setup error: ${error.message}`);
    }
  }

  async sendBulkNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new Error("Notifications must be a non-empty array");
    }

    return Promise.all(
      notifications.map((notification) =>
        this.sendNotification(notification).catch((error) => ({
          success: false,
          error: error.message,
          token: notification.token,
        }))
      )
    );
  }
}

const fcmClient = new FCMClient();
module.exports = fcmClient;
module.exports.FCMClient = FCMClient;
