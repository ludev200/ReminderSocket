# Socket Reminders (Node + TypeScript)

Simple Socket.IO server and Node client to send and receive reminder notifications. Useful to plug into another app and display push-like toasts.

## Scripts

- `npm run dev:server` – start the Socket.IO server (Express) with nodemon
- `npm run dev:client` – start a sample Node client that receives `reminder` events
- `npm run build` – compile TypeScript to `dist`
- `npm start` – run compiled server from `dist`

## Env

Copy `.env` and adjust as needed:

```
PORT=4000
SERVER_URL=http://localhost:4000
USER_ID=test-1
```

## Run

Terminal 1:

```
npm run dev:server
```

Terminal 2 (optional client to test):

```
npm run dev:client
```

## Send a reminder

Use curl or your backend to call the REST endpoint:

```
curl -X POST http://localhost:4000/api/reminders \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-1",          // omit to broadcast to all
    "title": "Reunión",
    "message": "Empieza en 5 minutos",
    "at": 0                       // optional UNIX ms timestamp in the future
  }'
```

If `at` is in the future, the server schedules a `setTimeout` to emit later; otherwise it emits immediately. The event name is `reminder` and payload `{ title, message, timestamp }`.


