import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body;
      
      if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
          error: 'username and password are required and must be strings' 
        });
      }

      const result = await AuthService.login(username.trim(), password);
      
      res.json({
        success: true,
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ 
        error: error instanceof Error ? error.message : 'Invalid credentials' 
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { name, username, password } = req.body;
      
      if (!name || !username || !password || 
          typeof name !== 'string' || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
          error: 'name, username and password are required and must be strings' 
        });
      }

      const result = await AuthService.register(name.trim(), username.trim(), password);
      
      res.status(201).json({
        success: true,
        token: result.token,
        user: {
          id: result.user.id,
          name: result.user.name,
          username: result.user.username
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Registration failed' 
      });
    }
  }

  static async me(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      // Validate JWT only, no database lookup
      const decoded = AuthService.validateJWTOnly(token);
      
      if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      res.json({
        success: true,
        user: {
          id: decoded.sub,
          name: decoded.name,
          username: decoded.username
        }
      });
    } catch (error) {
      console.error('Me endpoint error:', error);
      res.status(500).json({ 
        error: 'Internal server error' 
      });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(400).json({ error: 'No token provided' });
      }

      await AuthService.logout(token);
      
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ 
        error: 'Internal server error during logout' 
      });
    }
  }
}
