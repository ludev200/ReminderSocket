import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';

export function createReminderRoutes(io: Server) {
  const router = Router();

  type ReminderPayload = {
    title: string;
    message: string;
    at?: number;
  };

  // Broadcast route to send to all users
  router.post('/broadcast', (req: Request<unknown, unknown, ReminderPayload>, res: Response) => {
    const { title, message, at } = req.body || {};
    
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const emitReminder = () => {
      const event = 'reminder';
      const payload = { title, message, timestamp: Date.now() };
      
      console.log(`📢 [BROADCAST] Enviando mensaje a todos los usuarios: "${title}" - ${message}`);
      io.emit(event, payload);
    };

    if (typeof at === 'number' && at > Date.now()) {
      const delay = at - Date.now();
      console.log(`⏰ [BROADCAST] Mensaje programado para enviarse en ${delay}ms: "${title}"`);
      setTimeout(emitReminder, delay);
      return res.json({ scheduledInMs: delay });
    }

    emitReminder();
    return res.json({ sent: true });
  });

  // Route to send reminder to specific user by ID
  router.post('/to/:userId', (req: Request, res: Response) => {
    const { userId } = req.params;
    const { title, message, at } = req.body || {};
    
    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    const emitReminder = () => {
      const event = 'reminder';
      const payload = { title, message, timestamp: Date.now() };
      
      console.log(`👤 [USER:${userId}] Mensaje a usuario específico: "${title}" - ${message}`);
      // Send to specific user room
      io.to(`user:${userId}`).emit(event, payload);
    };

    if (typeof at === 'number' && at > Date.now()) {
      const delay = at - Date.now();
      console.log(`⏰ [USER:${userId}] Mensaje programado para enviarse en ${delay}ms: "${title}"`);
      setTimeout(emitReminder, delay);
      return res.json({ scheduledInMs: delay });
    }

    emitReminder();
    return res.json({ sent: true });
  });

  return router;
}
