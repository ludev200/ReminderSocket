import dotenv from "dotenv";
import express, { Request, Response } from "express";
import path from "path";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Resolve public folder to work both with ts-node and compiled dist
const publicDir = path.resolve(__dirname, "../../public");
app.use(express.static(publicDir));

// Serve index.html on root to avoid "Cannot GET /"
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const { userId } = socket.handshake.query as { userId?: string };
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on("disconnect", () => {
    // no-op
  });
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

type ReminderPayload = {
  userId?: string;
  title: string;
  message: string;
  at?: number; // unix ms timestamp in the future
};

app.post("/api/reminders", (req: Request<unknown, unknown, ReminderPayload>, res: Response) => {
  const { userId, title, message, at } = req.body || {};
  if (!title || !message) {
    return res.status(400).json({ error: "title and message are required" });
  }

  const emitReminder = () => {
    const event = "reminder";
    const payload = { title, message, timestamp: Date.now() };
    if (userId) {
      io.to(`user:${userId}`).emit(event, payload);
    } else {
      io.emit(event, payload);
    }
  };

  if (typeof at === "number" && at > Date.now()) {
    const delay = at - Date.now();
    setTimeout(emitReminder, delay);
    return res.json({ scheduledInMs: delay });
  }

  emitReminder();
  return res.json({ sent: true });
});

const PORT = Number(process.env.PORT || 4000);
httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Socket reminder server listening on http://localhost:${PORT}`);
});