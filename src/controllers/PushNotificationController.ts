import { Request, Response } from 'express';
import { PushNotificationService, PushNotificationData } from '../services/PushNotificationService';
import { UserModel } from '../models/User';

export class PushNotificationController {
  private pushService: PushNotificationService;

  constructor() {
    this.pushService = new PushNotificationService();
  }

  /**
   * Send test notification to all configured tokens
   */
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.pushService.sendTestNotification();
      
      res.json({
        success: true,
        message: 'Test notification sent',
        result
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send notification to specific tokens
   */
  async sendToTokens(req: Request, res: Response): Promise<void> {
    try {
      const { tokens, notification } = req.body;

      if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Tokens array is required and must not be empty'
        });
        return;
      }

      if (!notification || !notification.body) {
        res.status(400).json({
          success: false,
          message: 'Notification body is required'
        });
        return;
      }

      const result = await this.pushService.sendToMultipleTokens(tokens, notification);
      
      res.json({
        success: true,
        message: 'Notifications sent',
        result
      });
    } catch (error) {
      console.error('Error sending notifications to tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send notification to a specific user by ID
   */
  async sendToUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { notification } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      if (!notification || !notification.body) {
        res.status(400).json({
          success: false,
          message: 'Notification body is required'
        });
        return;
      }

      // Get user's push token
      const pushToken = await UserModel.getPushToken(userId);
      
      if (!pushToken) {
        res.status(404).json({
          success: false,
          message: 'User not found or no push token registered'
        });
        return;
      }

      const success = await this.pushService.sendToToken(pushToken, notification);
      
      if (success) {
        res.json({
          success: true,
          message: 'Notification sent to user',
          userId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to send notification to user'
        });
      }
    } catch (error) {
      console.error('Error sending notification to user:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification to user',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send notification to all registered users
   */
  async sendToAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { notification } = req.body;

      if (!notification || !notification.body) {
        res.status(400).json({
          success: false,
          message: 'Notification body is required'
        });
        return;
      }

      // Get all push tokens from database
      const pushTokens = await UserModel.getAllPushTokens();
      
      if (pushTokens.length === 0) {
        res.status(404).json({
          success: false,
          message: 'No users with push tokens found'
        });
        return;
      }

      const result = await this.pushService.sendToMultipleTokens(pushTokens, notification);
      
      res.json({
        success: true,
        message: 'Notifications sent to all users',
        result
      });
    } catch (error) {
      console.error('Error sending notifications to all users:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notifications to all users',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send push notification to all users (simple title/message format)
   */
  async sendBroadcastNotification(req: Request, res: Response): Promise<void> {
    try {
      const { title, message } = req.body;

      if (!title || !message) {
        res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
        return;
      }

      const tokens = this.pushService.getTokensFromEnv();
      // Get all push tokens from database
      // const pushTokens = await UserModel.getAllPushTokens();
      
      // if (pushTokens.length === 0) {
      //   res.status(404).json({
      //     success: false,
      //     message: 'No users with push tokens found'
      //   });
      //   return;
      // }

      // Create notification object from title and message
      const notification = {
        title,
        body: message,
        data: {
          timestamp: Date.now(),
          type: 'broadcast'
        }
      };

      console.log(`📱 [PUSH BROADCAST] Enviando notificación push a ${tokens.length} usuarios: "${title}" - ${message}`);
      
      const result = await this.pushService.sendToMultipleTokens(tokens, notification);
      
      res.json({
        success: true,
        message: 'Push notifications sent to all users',
        userCount: tokens.length,
        result
      });
    } catch (error) {
      console.error('Error sending push broadcast notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send push broadcast notifications',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Send notification to a specific room
   */
  async sendToRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomName, notification } = req.body;
      const io = (req as any).io; // Socket.IO instance should be attached to req

      if (!roomName) {
        res.status(400).json({
          success: false,
          message: 'Room name is required'
        });
        return;
      }

      if (!notification || !notification.body) {
        res.status(400).json({
          success: false,
          message: 'Notification body is required'
        });
        return;
      }

      if (!io) {
        res.status(500).json({
          success: false,
          message: 'Socket.IO instance not available'
        });
        return;
      }

      const userCount = await this.pushService.sendToRoom(roomName, notification, io);
      
      res.json({
        success: true,
        message: 'Notification sent to room',
        roomName,
        userCount
      });
    } catch (error) {
      console.error('Error sending notification to room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification to room',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Validate a push token
   */
  async validateToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({
          success: false,
          message: 'Token is required'
        });
        return;
      }

      const isValid = this.pushService.isValidPushToken(token);
      
      res.json({
        success: true,
        token,
        isValid
      });
    } catch (error) {
      console.error('Error validating token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate token',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get all configured tokens from environment
   */
  async getConfiguredTokens(req: Request, res: Response): Promise<void> {
    try {
      const tokens = this.pushService.getTokensFromEnv();
      
      res.json({
        success: true,
        tokenCount: tokens.length,
        tokens: tokens.map(token => ({
          token: token.substring(0, 20) + '...', // Only show first 20 chars for security
          isValid: this.pushService.isValidPushToken(token)
        }))
      });
    } catch (error) {
      console.error('Error getting configured tokens:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get configured tokens',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Register or update a user's push token
   */
  async registerPushToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { pushToken } = req.body;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      if (!pushToken) {
        res.status(400).json({
          success: false,
          message: 'Push token is required'
        });
        return;
      }

      if (!this.pushService.isValidPushToken(pushToken)) {
        res.status(400).json({
          success: false,
          message: 'Invalid push token format'
        });
        return;
      }

      const success = await UserModel.updatePushToken(userId, pushToken);
      
      if (success) {
        res.json({
          success: true,
          message: 'Push token registered successfully',
          userId
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to register push token'
        });
      }
    } catch (error) {
      console.error('Error registering push token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to register push token',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
