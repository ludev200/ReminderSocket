import { pool } from '../config/database';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
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

  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM user WHERE username = ?',
      [username]
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
}
