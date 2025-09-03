import { pool } from '../config/database';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
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
      'INSERT INTO user (id, name, username, email, googleId, avatar) VALUES (?, ?, ?, ?, ?, ?)',
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
    const users = rows as User[];
    return users.length > 0 ? (users[0] as User) : null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE email = ?',
      [email]
    );
    const users = rows as User[];
    return users.length > 0 ? (users[0] as User) : null;
  }

  static async findByGoogleId(googleId: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE googleId = ?',
      [googleId]
    );
    const users = rows as User[];
    return users.length > 0 ? (users[0] as User) : null;
  }

  static async findById(id: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE id = ?',
      [id]
    );
    const users = rows as User[];
    return users.length > 0 ? (users[0] as User) : null;
  }

  static async validateCredentials(username: string, password: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE username = ? AND password = ?',
      [username, password]
    );
    const users = rows as User[];
    return users.length > 0 ? (users[0] as User) : null;
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
}
