/**
 * Examples of how to use the Push Notification API
 * 
 * This file contains examples of HTTP requests you can make to test
 * the push notification functionality.
 */

// Example 1: Send test notification to all configured tokens
const testNotificationExample = `
curl -X GET http://localhost:4000/api/push/test
`;

// Example 2: Send notification to specific tokens
const sendToTokensExample = `
curl -X POST http://localhost:4000/api/push/tokens \\
  -H "Content-Type: application/json" \\
  -d '{
    "tokens": [
      "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]",
      "ExponentPushToken[yyyyyyyyyyyyyyyyyyyyyy]"
    ],
    "notification": {
      "title": "Important Update",
      "body": "You have a new message waiting",
      "data": {
        "type": "message",
        "messageId": "12345"
      },
      "sound": "default",
      "badge": 1
    }
  }'
`;

// Example 3: Send notification to a specific user
const sendToUserExample = `
curl -X POST http://localhost:4000/api/push/user/USER_ID_HERE \\
  -H "Content-Type: application/json" \\
  -d '{
    "notification": {
      "title": "Personal Reminder",
      "body": "Don't forget your meeting at 3 PM",
      "data": {
        "type": "reminder",
        "reminderId": "67890"
      }
    }
  }'
`;

// Example 4: Send notification to all registered users
const sendToAllUsersExample = `
curl -X POST http://localhost:4000/api/push/all-users \\
  -H "Content-Type: application/json" \\
  -d '{
    "notification": {
      "title": "System Maintenance",
      "body": "Server maintenance scheduled for tonight at 2 AM",
      "data": {
        "type": "maintenance",
        "startTime": "2024-01-15T02:00:00Z"
      }
    }
  }'
`;

// Example 5: Send notification to a Socket.IO room
const sendToRoomExample = `
curl -X POST http://localhost:4000/api/push/room \\
  -H "Content-Type: application/json" \\
  -d '{
    "roomName": "user:john_doe",
    "notification": {
      "title": "Room Notification",
      "body": "Someone joined your room",
      "data": {
        "type": "room_event",
        "event": "user_joined"
      }
    }
  }'
`;

// Example 6: Validate a push token
const validateTokenExample = `
curl -X GET http://localhost:4000/api/push/validate/ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
`;

// Example 7: Get all configured tokens
const getConfiguredTokensExample = `
curl -X GET http://localhost:4000/api/push/tokens
`;

// Example 8: Register a user's push token
const registerTokenExample = `
curl -X POST http://localhost:4000/api/push/register/USER_ID_HERE \\
  -H "Content-Type: application/json" \\
  -d '{
    "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
  }'
`;

// Example 9: JavaScript/TypeScript client usage
const clientUsageExample = `
import { PushNotificationService } from './services/PushNotificationService';

const pushService = new PushNotificationService();

// Send notification to a user
const notification = {
  title: "Hello!",
  body: "This is a test notification",
  data: { userId: "123" }
};

// Send to specific tokens
const tokens = ["ExponentPushToken[xxx]", "ExponentPushToken[yyy]"];
const result = await pushService.sendToMultipleTokens(tokens, notification);
console.log(\`Sent to \${result.success} users, \${result.failed} failed\`);

// Send test notification
const testResult = await pushService.sendTestNotification();
console.log(\`Test notification: \${testResult.success} sent, \${testResult.failed} failed\`);
`;

// Example 10: Environment variables setup
const envSetupExample = `
# .env file
PORT=4000
JWT_SECRET=your-secret-key

# Database
DB_HOST=localhost
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token
EXPO_PUSH_TOKENS=ExponentPushToken[xxx],ExponentPushToken[yyy]
`;

console.log('Push Notification API Examples:');
console.log('===============================');
console.log('');
console.log('1. Test Notification:', testNotificationExample);
console.log('');
console.log('2. Send to Specific Tokens:', sendToTokensExample);
console.log('');
console.log('3. Send to Specific User:', sendToUserExample);
console.log('');
console.log('4. Send to All Users:', sendToAllUsersExample);
console.log('');
console.log('5. Send to Room:', sendToRoomExample);
console.log('');
console.log('6. Validate Token:', validateTokenExample);
console.log('');
console.log('7. Get Configured Tokens:', getConfiguredTokensExample);
console.log('');
console.log('8. Register User Token:', registerTokenExample);
console.log('');
console.log('9. Client Usage:', clientUsageExample);
console.log('');
console.log('10. Environment Setup:', envSetupExample);

export {
  testNotificationExample,
  sendToTokensExample,
  sendToUserExample,
  sendToAllUsersExample,
  sendToRoomExample,
  validateTokenExample,
  getConfiguredTokensExample,
  registerTokenExample,
  clientUsageExample,
  envSetupExample
};
