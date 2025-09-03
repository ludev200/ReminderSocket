import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';

export function createReminderRoutes(io: Server) {
  const router = Router();

  type ReminderPayload = {
    title: string;
    message: string;
    at?: number;
    broadcast?: boolean; // If true, send to all users
  };

  router.post('/', (req: Request<unknown, unknown, ReminderPayload>, res: Response) => {
    const { title, message, at, broadcast = false } = req.body || {};
    
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const emitReminder = () => {
      const event = 'reminder';
      const payload = { title, message, timestamp: Date.now() };
      
      if (broadcast) {
        // Send to all connected users
        io.emit(event, payload);
      } else {
        // Send to specific user (extract from auth token)
        // This would require middleware to extract user from JWT
        // For now, we'll send to all users in the reminder room
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

  // New endpoint to send reminder to specific user by ID
  router.post('/to/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { title, message, at } = req.body || {};
    
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const emitReminder = () => {
      const event = 'reminder';
      const payload = { title, message, timestamp: Date.now() };
      
      // Send to specific user room
      io.to(`user:${userId}`).emit(event, payload);
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
