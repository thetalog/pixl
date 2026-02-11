const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

/**
 * FCM Client for sending push notifications via Firebase Cloud Messaging HTTP v1 API
 * Uses google-auth-library for OAuth2 authentication
 */

class FCMClient {
  constructor() {
    this.projectId = process.env.FIREBASE_PROJECT_ID;
    this.auth = new GoogleAuth({
      scopes: ['https://www.googleapis.com/auth/firebase.messaging']
    });
    
    if (!this.projectId) {
      throw new Error('FIREBASE_PROJECT_ID environment variable is required');
    }
  }

  /**
   * Send a push notification via FCM HTTP v1 API
   * @param {Object} options - Notification options
   * @param {string} options.token - Device registration token
   * @param {string} options.title - Notification title
   * @param {string} options.body - Notification body
   * @param {Object} [options.data] - Optional data payload
   * @returns {Promise<Object>} FCM API response
   */
  async sendNotification({ token, title, body, data = {} }) {
    // Validate required parameters
    if (!token) {
      throw new Error('Device token is required');
    }
    if (!title) {
      throw new Error('Notification title is required');
    }
    if (!body) {
      throw new Error('Notification body is required');
    }

    try {
      // Get authenticated client and access token
      const client = await this.auth.getClient();
      const accessToken = await client.getAccessToken();
      
      if (!accessToken.token) {
        throw new Error('Failed to obtain OAuth2 access token');
      }

      // Construct FCM HTTP v1 API endpoint
      const url = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
      
      // Build notification payload
      const payload = {
        message: {
          token,
          notification: {
            title,
            body
          },
          data
        }
      };

      // Send POST request to FCM API
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      return {
        success: true,
        messageId: response.data.name,
        response: response.data
      };

    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // FCM API returned an error response
        const status = error.response.status;
        const message = error.response.data?.error?.message || 'Unknown FCM error';
        
        throw new Error(`FCM API error ${status}: ${message}`);
      } else if (error.request) {
        // Request was made but no response received
        throw new Error('No response received from FCM server');
      } else {
        // Error in setting up the request
        throw new Error(`Request setup error: ${error.message}`);
      }
    }
  }

  /**
   * Send multiple notifications in parallel
   * @param {Array<Object>} notifications - Array of notification objects
   * @returns {Promise<Array>} Array of results
   */
  async sendBulkNotifications(notifications) {
    if (!Array.isArray(notifications) || notifications.length === 0) {
      throw new Error('Notifications must be a non-empty array');
    }

    // Send all notifications concurrently
    const promises = notifications.map(notification => 
      this.sendNotification(notification)
        .catch(error => ({
          success: false,
          error: error.message,
          token: notification.token
        }))
    );

    return Promise.all(promises);
  }
}

// Export singleton instance
const fcmClient = new FCMClient();
module.exports = fcmClient;

// Export class for testing/custom instances
module.exports.FCMClient = FCMClient;