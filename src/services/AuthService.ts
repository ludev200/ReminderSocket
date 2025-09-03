import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/User';
import { SessionModel, Session } from '../models/Session';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export class AuthService {
  static async login(username: string, password: string): Promise<{ token: string; user: User }> {
    // Validate credentials
    const user = await UserModel.validateCredentials(username, password);
    
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await SessionModel.create(user.id, token, expiresAt);

    return { token, user };
  }

  static async register(name: string, username: string, password: string): Promise<{ token: string; user: User }> {
    // Check if username already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Create new user
    const user = await UserModel.create(name, username, password);

    // Generate JWT token
    const token = this.generateToken(user);

    // Store session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    await SessionModel.create(user.id, token, expiresAt);

    return { token, user };
  }

  static generateToken(user: User): string {
    return jwt.sign(
      { 
        sub: user.id, 
        username: user.username, 
        name: user.name,
        email: user.email,
        googleId: user.googleId
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  static async createSession(userId: string, token: string, expiresAt: Date): Promise<void> {
    await SessionModel.create(userId, token, expiresAt);
  }

  static async validateToken(token: string): Promise<User | null> {
    try {
      // Check if session exists and is valid
      const session = await SessionModel.findByToken(token);
      if (!session) {
        return null;
      }

      // Verify JWT
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await UserModel.findById(decoded.sub);
      
      return user;
    } catch (error) {
      return null;
    }
  }

  static validateJWTOnly(token: string): { sub: string; username: string; name: string; email?: string; googleId?: string } | null {
    try {
      // Only verify JWT signature and expiration, no database lookup
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        sub: decoded.sub,
        username: decoded.username,
        name: decoded.name,
        email: decoded.email,
        googleId: decoded.googleId
      };
    } catch (error) {
      return null;
    }
  }

  static async logout(token: string): Promise<void> {
    await SessionModel.deleteByToken(token);
  }

  static async cleanupExpiredSessions(): Promise<void> {
    await SessionModel.deleteExpired();
  }
}
