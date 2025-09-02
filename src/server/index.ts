import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { testConnection } from "../config/database";
import authRoutes from "../routes/auth";
import { createReminderRoutes } from "../routes/reminders";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Test database connection on startup
testConnection();

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  const { userId } = socket.handshake.query as { userId?: string };
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on("disconnect", () => {
    // no-op
  });
});

// Serve static files
const publicDir = path.resolve(__dirname, "../../public");
app.use(express.static(publicDir));

// Serve index.html on root
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/reminders", createReminderRoutes(io));

const PORT = Number(process.env.PORT || 4000);
httpServer.listen(PORT, () => {
  console.log(`Socket reminder server listening on http://localhost:${PORT}`);
});