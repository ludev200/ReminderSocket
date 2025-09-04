import { pool } from '../config/database';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  password?: string;
  google_id?: string;  // Database field name
  googleId?: string;   // Interface field name for compatibility
  profile_picture?: string;  // Database field name
  avatar?: string;     // Interface field name for compatibility
  pushToken?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoogleUserData {
  googleId: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
}

export class UserModel {
  // Helper method to map database fields to interface
  private static mapDbToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      email: dbUser.email,
      password: dbUser.password,
      google_id: dbUser.google_id,
      googleId: dbUser.google_id,  // Map for compatibility
      profile_picture: dbUser.profile_picture,
      avatar: dbUser.profile_picture,  // Map for compatibility
      pushToken: dbUser.pushToken,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    };
  }

  static async create(name: string, username: string, password: string): Promise<User> {
    const id = crypto.randomUUID();
    const [result] = await pool.execute(
      'INSERT INTO user (id, name, username, password) VALUES (?, ?, ?, ?)',
      [id, name, username, password]
    );
    return { id, name, username, password };
  }

  static async createFromGoogle(userData: GoogleUserData): Promise<User> {
    const id = crypto.randomUUID();
    const [result] = await pool.execute(
      'INSERT INTO user (id, name, username, email, google_id, profile_picture) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userData.name, userData.username, userData.email, userData.googleId, userData.avatar]
    );
    return { 
      id, 
      name: userData.name, 
      username: userData.username, 
      email: userData.email,
      googleId: userData.googleId,
      avatar: userData.avatar
    };
  }

  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );
    const users = rows as any[];
    return users.length > 0 ? this.mapDbToUser(users[0]) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );
    const users = rows as any[];
    return users.length > 0 ? this.mapDbToUser(users[0]) : null;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE google_id = ?',
      [googleId]
    );
    const users = rows as any[];
    return users.length > 0 ? this.mapDbToUser(users[0]) : null;
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE id = ?',
      [id]
    );
    const users = rows as any[];
    return users.length > 0 ? this.mapDbToUser(users[0]) : null;
  }

  static async validateCredentials(username: string, password: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE username = ? AND password = ?',
      [username, password]
    );
    const users = rows as any[];
    return users.length > 0 ? this.mapDbToUser(users[0]) : null;
  }

  static async updatePushToken(userId: string, pushToken: string): Promise<boolean> {
    try {
      await pool.execute(
        'UPDATE user SET pushToken = ?, updatedAt = NOW() WHERE id = ?',
        [pushToken, userId]
      );
      return true;
    } catch (error) {
      console.error('Error updating push token:', error);
      return false;
    }
  }

  static async getPushToken(userId: string): Promise<string | null> {
    try {
      const [rows] = await pool.execute(
        'SELECT pushToken FROM user WHERE id = ?',
        [userId]
      );
      const users = rows as any[];
      return users.length > 0 ? users[0].pushToken : null;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  static async getAllPushTokens(): Promise<string[]> {
    try {
      const [rows] = await pool.execute(
        'SELECT pushToken FROM user WHERE pushToken IS NOT NULL AND pushToken != ""'
      );
      const users = rows as any[];
      return users.map(user => user.pushToken).filter(token => token);
    } catch (error) {
      console.error('Error getting all push tokens:', error);
      return [];
    }
  }

  // Method to handle Google OAuth login - find or create user
  static async findOrCreateGoogleUser(googleId: string, email: string, name: string, avatar?: string): Promise<User> {
    // First, try to find existing user by Google ID
    let user = await this.findByGoogleId(googleId);
    
    if (user) {
      // User exists, update their info if needed
      if (name !== user.name || avatar !== user.avatar) {
        await pool.execute(
          'UPDATE user SET name = ?, profile_picture = ? WHERE google_id = ?',
          [name, avatar || user.avatar, googleId]
        );
        user.name = name;
        if (avatar !== undefined) {
          user.avatar = avatar;
        }
      }
      return user;
    }

    // User doesn't exist, create new one
    const username = email.split('@')[0] || googleId;
    const userData: GoogleUserData = {
      googleId,
      email,
      name,
      username,
      avatar: avatar || ''
    };
    
    return await this.createFromGoogle(userData);
  }
}
