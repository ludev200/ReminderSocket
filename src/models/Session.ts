import { pool } from '../config/database';

export interface Session {
  id?: number;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export class SessionModel {
  static async create(userId: string, token: string, expiresAt: Date): Promise<Session> {
    const [result] = await pool.execute(
      'INSERT INTO session (user_id, token, expires_at, created_at) VALUES (?, ?, ?, NOW())',
      [userId, token, expiresAt]
    );
    const insertId = (result as any).insertId;
    return { id: insertId, user_id: userId, token, expires_at: expiresAt, created_at: new Date() };
  }

  static async findByToken(token: string): Promise<Session | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM session WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    const sessions = rows as Session[];
    return sessions.length > 0 ? (sessions[0] as Session) : null;
  }

  static async deleteByToken(token: string): Promise<void> {
    await pool.execute(
      'DELETE FROM session WHERE token = ?',
      [token]
    );
  }

  static async deleteExpired(): Promise<void> {
    await pool.execute(
      'DELETE FROM session WHERE expires_at <= NOW()'
    );
  }

  static async deleteByUserId(userId: string): Promise<void> {
    await pool.execute(
      'DELETE FROM session WHERE user_id = ?',
      [userId]
    );
  }
}
