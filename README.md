# Socket Reminders (Node + TypeScript + MySQL)

Simple Socket.IO server and Node client to send and receive reminder notifications. Built with MVC architecture and MySQL database.

## Project Structure (MVC)

```
src/
├── config/          # Database configuration
├── controllers/     # HTTP request handlers
├── models/          # Database models
├── routes/          # API route definitions
├── services/        # Business logic
├── server/          # Main server file
└── client/          # Node.js socket client
```

## Prerequisites

- MySQL server running
- Node.js 16+

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Database setup:**
   - Create MySQL database using `database.sql`
   - Update `.env` with your MySQL credentials

3. **Environment variables (.env):**
   ```
   PORT=4000
   SERVER_URL=http://localhost:4000
   USER_ID=test-1
   JWT_SECRET=your-secret-key
   
   # MySQL Database
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your-password
   DB_NAME=reminder_socket
   DB_PORT=3306
   ```

## Scripts

- `npm run dev:server` – start the Socket.IO server with nodemon
- `npm run dev:client` – start a sample Node client that receives `reminder` events
- `npm run build` – compile TypeScript to `dist`
- `npm start` – run compiled server from `dist`

## Run

Terminal 1:
```bash
npm run dev:server
```

Terminal 2 (optional client to test):
```bash
npm run dev:client
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout and invalidate token

### Reminders
- `POST /api/reminders` - Send reminder (immediate or scheduled)

## Send a reminder

Use curl or your backend to call the REST endpoint:

```bash
curl -X POST http://localhost:4000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-1",          # omit to broadcast to all
    "title": "Reunión",
    "message": "Empieza en 5 minutos",
    "at": 0                       # optional UNIX ms timestamp in the future
  }'
```

## Web Interface

Open `http://localhost:4000/` in your browser for a visual demo of the reminder system.

## Database Schema

- **users**: id, username, created_at, updated_at
- **sessions**: id, user_id, token, expires_at, created_at

The system automatically creates users on first login and manages JWT sessions with expiration.


