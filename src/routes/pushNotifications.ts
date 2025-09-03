import { Router } from 'express';
import { PushNotificationController } from '../controllers/PushNotificationController';

export function createPushNotificationRoutes(io: any) {
  const router = Router();
  const pushController = new PushNotificationController();

  // Middleware to attach Socket.IO instance to request
  router.use((req: any, _res, next) => {
    req.io = io;
    next();
  });

  // GET /api/push/test - Send test notification to all configured tokens
  router.get('/test', (req, res) => pushController.sendTestNotification(req, res));

  // POST /api/push/tokens - Send notification to specific tokens
  router.post('/tokens', (req, res) => pushController.sendToTokens(req, res));

  // POST /api/push/user/:userId - Send notification to a specific user
  router.post('/user/:userId', (req, res) => pushController.sendToUser(req, res));

  // POST /api/push/all-users - Send notification to all registered users
  router.post('/all-users', (req, res) => pushController.sendToAllUsers(req, res));

  // POST /api/push/broadcast - Send push notification to all users (simple title/message)
  router.post('/broadcast', (req, res) => pushController.sendBroadcastNotification(req, res));

  // POST /api/push/room - Send notification to a specific room
  router.post('/room', (req, res) => pushController.sendToRoom(req, res));

  // GET /api/push/validate/:token - Validate a push token
  router.get('/validate/:token', (req, res) => pushController.validateToken(req, res));

  // GET /api/push/tokens - Get all configured tokens (for debugging)
  router.get('/tokens', (req, res) => pushController.getConfiguredTokens(req, res));

  // POST /api/push/register/:userId - Register or update a user's push token
  router.post('/register/:userId', (req, res) => pushController.registerPushToken(req, res));

  return router;
}
