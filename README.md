# Socket Reminders with Push Notifications & Google OAuth

A real-time reminder system built with Socket.IO, Express, and TypeScript, featuring push notifications via Expo and Google OAuth authentication.

## Features

- **Real-time Communication**: Socket.IO for instant updates
- **Authentication**: JWT-based user authentication + Google OAuth
- **Push Notifications**: Send notifications to mobile devices via Expo
- **User Management**: User registration, login, and session management
- **Reminder System**: Create and manage reminders with real-time updates
- **Database**: MySQL database with connection pooling
- **Google OAuth**: Sign in with Google account

## Push Notification Features

- Send notifications to specific users
- Send notifications to all registered users
- Send notifications to Socket.IO rooms
- Validate push tokens
- Register and update user push tokens
- Test notifications to configured tokens

## Authentication Features

- **Local Authentication**: Username/password registration and login
- **Google OAuth**: Sign in with Google account
- **JWT Tokens**: Secure authentication with token expiration
- **Session Management**: Server-side session handling with Passport

## Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=4000
JWT_SECRET=your-secret-key
SESSION_SECRET=your-session-secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database

# Expo Push Notifications
EXPO_ACCESS_TOKEN=your-expo-access-token
EXPO_PUSH_TOKENS=ExponentPushToken[xxx],ExponentPushToken[yyy]

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up your database and update the `.env` file

3. Configure Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Set authorized redirect URI to: `http://localhost:4000/api/auth/google/callback`

4. Run the development server:
```bash
npm run dev:server
```

5. Run the client (in another terminal):
```bash
npm run dev:client
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login (local)
- `POST /api/auth/register` - User registration (local)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/status` - Check authentication status
- `GET /api/auth/success` - OAuth success page
- `GET /api/auth/failure` - OAuth failure page

### Push Notifications
- `GET /api/push/test` - Send test notification
- `POST /api/push/tokens` - Send to specific tokens
- `POST /api/push/user/:userId` - Send to specific user
- `POST /api/push/all-users` - Send to all users
- `POST /api/push/room` - Send to Socket.IO room
- `GET /api/push/validate/:token` - Validate push token
- `GET /api/push/tokens` - Get configured tokens
- `POST /api/push/register/:userId` - Register user push token

### Reminders
- `GET /api/reminders` - Get user reminders
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

## Google OAuth Flow

1. **Initiate Login**: User visits `/api/auth/google`
2. **Google Consent**: User is redirected to Google for authentication
3. **Callback**: Google redirects back to `/api/auth/google/callback`
4. **Token Generation**: Server generates JWT token and creates session
5. **Success Redirect**: User is redirected to success page with token

## Socket.IO Events

- `connection` - User connects
- `disconnect` - User disconnects
- Users automatically join personal rooms: `user:{userId}` and `user:{username}`

## Database Schema

The application expects the following tables:

### Users Table
```sql
CREATE TABLE user (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),
  password VARCHAR(255),
  googleId VARCHAR(255) UNIQUE,
  avatar VARCHAR(500),
  pushToken VARCHAR(500),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE session (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(500) NOT NULL,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES user(id)
);
```

## Building and Running

Build the project:
```bash
npm run build
```

Run production server:
```bash
npm start
```

## Development

The project uses TypeScript with strict type checking. Run the development server with hot reload:

```bash
npm run dev:server
```

## License

ISC


