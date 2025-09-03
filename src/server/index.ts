import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import http from "http";
import cors from "cors";
import { Server, Socket } from "socket.io";
import { testConnection } from "../config/database";
import { AuthService } from "../services/AuthService";
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

// Socket.IO connection handling with JWT validation
io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    // Validate JWT token
    const decoded = AuthService.validateJWTOnly(token as string);
    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }

    // Attach user info to socket
    (socket as any).user = {
      id: decoded.sub,
      username: decoded.username,
      name: decoded.name
    };

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  console.log(`User ${user.username} (${user.name}) connected with socket ID: ${socket.id}`);
  
  // Join user to their personal room
  socket.join(`user:${user.id}`);
  
  // Join user to their username room (for backward compatibility)
  socket.join(`user:${user.username}`);

  socket.on("disconnect", () => {
    console.log(`User ${user.username} disconnected`);
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