import fs from "fs";
import path from "path";

export type Session = {
  id: string; // same as username for simplicity
  username: string;
  createdAt: number;
};

const dataDir = path.resolve(process.cwd(), "data");
const filePath = path.join(dataDir, "sessions.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify({ sessions: [] as Session[] }, null, 2));
  }
}

export function readSessions(): Session[] {
  ensureStore();
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw) as { sessions: Session[] };
  return data.sessions || [];
}

export function writeSessions(sessions: Session[]) {
  ensureStore();
  fs.writeFileSync(filePath, JSON.stringify({ sessions }, null, 2));
}

export function upsertSession(username: string): Session {
  const sessions = readSessions();
  const existing = sessions.find((s) => s.username.toLowerCase() === username.toLowerCase());
  if (existing) return existing;
  const newSession: Session = { id: username, username, createdAt: Date.now() };
  sessions.push(newSession);
  writeSessions(sessions);
  return newSession;
}

export function findSessionByUsername(username: string): Session | undefined {
  const sessions = readSessions();
  return sessions.find((s) => s.username.toLowerCase() === username.toLowerCase());
}


