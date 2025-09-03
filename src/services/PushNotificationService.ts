import { Expo, ExpoPushMessage } from 'expo-server-sdk';

export interface PushNotificationData {
  title?: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  channelId?: string;
}

export class PushNotificationService {
  private expo: Expo;

  constructor() {
    const config: any = { useFcmV1: true };
    if (process.env.EXPO_ACCESS_TOKEN) {
      config.accessToken = process.env.EXPO_ACCESS_TOKEN;
    }
    this.expo = new Expo(config);
  }

  /**
   * Validate if a push token is valid
   */
  isValidPushToken(token: string): boolean {
    return Expo.isExpoPushToken(token);
  }

  /**
   * Send push notification to a single token
   */
  async sendToToken(token: string, notification: PushNotificationData): Promise<boolean> {
    if (!this.isValidPushToken(token)) {
      console.error(`Push token ${token} is not a valid Expo push token`);
      return false;
    }

    const message: ExpoPushMessage = {
      to: token,
      sound: notification.sound || 'default',
      body: notification.body,
      data: notification.data || {},
    };
    
    if (notification.title) message.title = notification.title;
    if (notification.badge) message.badge = notification.badge;
    if (notification.channelId) message.channelId = notification.channelId;

    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Check receipts for errors
      await this.checkReceipts(tickets);
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple tokens
   */
  async sendToMultipleTokens(tokens: string[], notification: PushNotificationData): Promise<{ success: number; failed: number }> {
    const validTokens = tokens.filter(token => this.isValidPushToken(token));
    const invalidTokens = tokens.filter(token => !this.isValidPushToken(token));

    if (invalidTokens.length > 0) {
      console.warn(`Invalid tokens found: ${invalidTokens.join(', ')}`);
    }

    if (validTokens.length === 0) {
      return { success: 0, failed: tokens.length };
    }

    const messages: ExpoPushMessage[] = validTokens.map(token => {
      const message: ExpoPushMessage = {
        to: token,
        sound: notification.sound || 'default',
        body: notification.body,
        data: notification.data || {},
      };
      
      if (notification.title) message.title = notification.title;
      if (notification.badge) message.badge = notification.badge;
      if (notification.channelId) message.channelId = notification.channelId;
      
      return message;
    });

    try {
      const chunks = this.expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      }

      // Check receipts for errors
      const receiptResults = await this.checkReceipts(tickets);
      const failedCount = receiptResults.filter(result => !result.success).length;

      return {
        success: validTokens.length - failedCount,
        failed: failedCount + invalidTokens.length
      };
    } catch (error) {
      console.error('Error sending push notifications:', error);
      return { success: 0, failed: tokens.length };
    }
  }

  /**
   * Send push notification to all users in a room
   */
  async sendToRoom(roomName: string, notification: PushNotificationData, io: any): Promise<number> {
    const room = io.sockets.adapter.rooms.get(roomName);
    if (!room) {
      console.log(`Room ${roomName} not found`);
      return 0;
    }

    // Get user IDs in the room
    const userIds = Array.from(room);
    console.log(`Sending notification to ${userIds.length} users in room ${roomName}`);

    // In a real implementation, you would need to store push tokens for users
    // For now, we'll just log the action
    console.log(`Would send notification "${notification.body}" to room ${roomName}`);
    
    return userIds.length;
  }

  /**
   * Check delivery receipts for sent notifications
   */
  private async checkReceipts(tickets: any[]): Promise<Array<{ success: boolean; error?: string }>> {
    const receiptIds = tickets
      .filter((ticket) => ticket.id)
      .map((ticket) => ticket.id);

    if (receiptIds.length === 0) {
      return [];
    }

    const results: Array<{ success: boolean; error?: string }> = [];
    const receiptIdChunks = this.expo.chunkPushNotificationReceiptIds(receiptIds);

    for (const chunk of receiptIdChunks) {
      try {
        const receipts = await this.expo.getPushNotificationReceiptsAsync(chunk);
        
        for (const receiptId in receipts) {
          const receipt = receipts[receiptId];
          if (!receipt) continue;
          
          const { status } = receipt;
          
          if (status === 'ok') {
            results.push({ success: true });
          } else if (status === 'error') {
            const errorMsg = `Error sending notification: ${receipt.message || 'Unknown error'}`;
            console.error(errorMsg);
            results.push({ success: false, error: errorMsg });
          }
        }
      } catch (error) {
        console.error('Error fetching receipts:', error);
        results.push({ success: false, error: 'Failed to fetch receipt' });
      }
    }

    return results;
  }

  /**
   * Get all push tokens from environment variable
   */
  getTokensFromEnv(): string[] {
    const rawTokens = process.env.EXPO_PUSH_TOKENS || '';
    return rawTokens
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
  }

  /**
   * Send test notification to all configured tokens
   */
  async sendTestNotification(): Promise<{ success: number; failed: number }> {
    const tokens = this.getTokensFromEnv();
    
    if (tokens.length === 0) {
      console.error('No push tokens provided. Set EXPO_PUSH_TOKENS in your .env file.');
      return { success: 0, failed: 0 };
    }

    const notification: PushNotificationData = {
      title: 'si esto que siento',
      body: 'ya no pienso en ti no me deja dormir ey',
      data: { withSome: 'data', timestamp: new Date().toISOString() },
    };

    return this.sendToMultipleTokens(tokens, notification);
  }
}
