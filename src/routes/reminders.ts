import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';

export function createReminderRoutes(io: Server) {
  const router = Router();

  type ReminderPayload = {
    userId?: string;
    title: string;
    message: string;
    at?: number;
  };

  router.post('/', (req: Request<unknown, unknown, ReminderPayload>, res: Response) => {
    const { userId, title, message, at } = req.body || {};
    
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const emitReminder = () => {
      const event = 'reminder';
      const payload = { title, message, timestamp: Date.now() };
      
      if (userId) {
        io.to(`user:${userId}`).emit(event, payload);
      } else {
        io.emit(event, payload);
      }
    };

    if (typeof at === 'number' && at > Date.now()) {
      const delay = at - Date.now();
      setTimeout(emitReminder, delay);
      return res.json({ scheduledInMs: delay });
    }

    emitReminder();
    return res.json({ sent: true });
  });

  return router;
}
