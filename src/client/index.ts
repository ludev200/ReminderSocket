import dotenv from "dotenv";
import { io, Socket } from "socket.io-client";

dotenv.config();

const serverUrl = process.env.SERVER_URL || "http://localhost:4000";
const userId = process.env.USER_ID || `user-${Math.random().toString(36).slice(2, 8)}`;


const socket: Socket = io(serverUrl, {
  transports: ["websocket"],
  query: { userId },
});

socket.on("connect", () => {
  // eslint-disable-next-line no-console
  console.log(`Connected as ${userId}. Socket ID: ${socket.id}`);
});

socket.on("reminder", (data: { title: string; message: string; timestamp: number }) => {
  // eslint-disable-next-line no-console
  console.log(`[REMINDER] ${data.title}: ${data.message} @ ${new Date(data.timestamp).toLocaleString()}`);
});

socket.on("disconnect", (reason) => {
  // eslint-disable-next-line no-console
  console.log(`Disconnected: ${reason}`);
});

socket.on("connect_error", (err) => {
  // eslint-disable-next-line no-console
  console.error("Connection error:", err.message);
});