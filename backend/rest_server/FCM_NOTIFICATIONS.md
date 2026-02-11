# FCM Notification System

A production-ready Firebase Cloud Messaging (FCM) notification system for Node.js using ES modules.

## Features

- ✅ Uses FCM HTTP v1 API (no firebase-admin)
- ✅ OAuth2 authentication with google-auth-library
- ✅ Single and bulk notification sending
- ✅ Comprehensive input validation
- ✅ Clean error handling
- ✅ ES modules support
- ✅ Production-ready structure

## Prerequisites

1. Firebase project with Cloud Messaging enabled
2. Service account key JSON file
3. Environment variables configured

## Environment Variables

Create a `.env` file with the following variables:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Server Configuration
PORT=3001
NODE_ENV=development
```

## Installation

1. Ensure your `package.json` has `"type": "module"`
2. Install required dependencies (if not already installed):
   ```bash
   npm install express axios google-auth-library dotenv
   ```

## File Structure

```
backend/rest_server/
├── lib/
│   └── fcmClient.js              # Reusable FCM client
├── routes/
│   └── notifications/
│       └── notifications.route.js # Express routes
├── index.example.js              # Example server setup
└── package.json                  # Updated with "type": "module"
```

## Usage

### 1. FCM Client (lib/fcmClient.js)

```javascript
import fcmClient from './lib/fcmClient.js';

// Send single notification
const result = await fcmClient.sendNotification({
  token: 'device_registration_token',
  title: 'Hello World',
  body: 'This is a test notification',
  data: { custom: 'data' }
});

// Send bulk notifications
const results = await fcmClient.sendBulkNotifications([
  {
    token: 'token1',
    title: 'Notification 1',
    body: 'Body 1',
    data: { key: 'value1' }
  },
  {
    token: 'token2',
    title: 'Notification 2',
    body: 'Body 2'
  }
]);
```

### 2. Express Routes

#### Send Single Notification
```http
POST /notifications/send
Content-Type: application/json

{
  "token": "device_registration_token",
  "title": "Hello World",
  "body": "This is a test notification",
  "data": {
    "custom": "data",
    "userId": "123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "projects/your-project-id/messages/0:1234567890123456",
  "response": {
    "name": "projects/your-project-id/messages/0:1234567890123456"
  }
}
```

#### Send Bulk Notifications
```http
POST /notifications/bulk
Content-Type: application/json

{
  "notifications": [
    {
      "token": "device_token_1",
      "title": "Title 1",
      "body": "Body 1",
      "data": { "key": "value1" }
    },
    {
      "token": "device_token_2",
      "title": "Title 2",
      "body": "Body 2"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "total": 2,
  "successful": 2,
  "failed": 0,
  "results": [
    {
      "success": true,
      "messageId": "projects/.../messages/...",
      "response": { ... }
    },
    {
      "success": true,
      "messageId": "projects/.../messages/...",
      "response": { ... }
    }
  ]
}
```

## Error Handling

The system provides clear error responses:

### Validation Errors (400)
```json
{
  "success": false,
  "error": "Missing required field: token"
}
```

### FCM API Errors (400)
```json
{
  "success": false,
  "error": "FCM API error 404: The registration token is not a valid FCM registration token"
}
```

### Server Errors (500)
```json
{
  "success": false,
  "error": "Failed to send notification"
}
```

## Integration with Existing Server

To integrate with your existing server:

1. **Add the route to your index.js:**
   ```javascript
   import notificationsRoutes from './routes/notifications/notifications.route.js';
   
   // Make it public (no auth)
   app.use('/notifications', notificationsRoutes);
   
   // OR make it protected (with auth)
   app.use('/notifications', authenticationMiddleware, notificationsRoutes);
   ```

2. **Ensure ES module support:**
   - Add `"type": "module"` to package.json
   - Use `import` instead of `require()`

3. **Set environment variables:**
   ```bash
   export FIREBASE_PROJECT_ID="your-project-id"
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
   ```

## Testing

You can test the endpoints using curl:

```bash
# Send single notification
curl -X POST http://localhost:3001/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_DEVICE_TOKEN",
    "title": "Test Notification",
    "body": "Hello from FCM!",
    "data": { "test": "value" }
  }'

# Send bulk notifications
curl -X POST http://localhost:3001/notifications/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": [
      {
        "token": "TOKEN1",
        "title": "Notification 1",
        "body": "Body 1"
      },
      {
        "token": "TOKEN2",
        "title": "Notification 2",
        "body": "Body 2"
      }
    ]
  }'
```

## Security Considerations

1. **Rate Limiting**: Implement rate limiting for notification endpoints
2. **Authentication**: Consider protecting endpoints with authentication
3. **Token Validation**: Validate device tokens before sending
4. **Environment Variables**: Never commit service account keys to version control
5. **Logging**: Use proper logging in production instead of console.log

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a process manager like PM2
3. Configure proper logging
4. Set up monitoring
5. Use environment-specific configuration

## Troubleshooting

### Common Issues:

1. **"FIREBASE_PROJECT_ID environment variable is required"**
   - Ensure `FIREBASE_PROJECT_ID` is set in your environment

2. **"Failed to obtain OAuth2 access token"**
   - Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid service account JSON file
   - Ensure the service account has Firebase Messaging permissions

3. **"FCM API error 404: The registration token is not a valid FCM registration token"**
   - The device token is invalid or expired
   - Ensure you're using the correct token from the client SDK

4. **"Invalid token format"**
   - Device token should be a string with at least 10 characters

## Dependencies

- `express`: Web framework
- `axios`: HTTP client for FCM API
- `google-auth-library`: OAuth2 authentication
- `dotenv`: Environment variable management

## License

ISC