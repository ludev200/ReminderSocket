import { Router } from 'express';
import passport from 'passport';
import { AuthService } from '../services/AuthService';

const router = Router();

// Local authentication routes
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    const result = await AuthService.login(username, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      ...result
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error instanceof Error ? error.message : 'Login failed'
    });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { name, username, password } = req.body;
    
    if (!name || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, username and password are required'
      });
    }

    const result = await AuthService.register(name, username, password);
    
    res.json({
      success: true,
      message: 'Registration successful',
      ...result
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : 'Registration failed'
    });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (token) {
      await AuthService.logout(token);
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/api/auth/failure' }),
  async (req, res) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        return res.redirect('/api/auth/failure');
      }

      // Generate JWT token
      const token = AuthService.generateToken(user);
      
      // Store session in database
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      await AuthService.createSession(user.id, token, expiresAt);

      // Redirect to frontend with token
      res.redirect(`/api/auth/success?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}`);
    } catch (error) {
      console.error('Google callback error:', error);
      res.redirect('/api/auth/failure');
    }
  }
);

// Auth status and failure routes
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      success: true,
      authenticated: true,
      user: req.user
    });
  } else {
    res.json({
      success: true,
      authenticated: false
    });
  }
});

router.get('/failure', (req, res) => {
  res.json({
    success: false,
    message: 'Authentication failed'
  });
});

router.get('/success', (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    token: req.query.token,
    user: req.query.user ? JSON.parse(decodeURIComponent(req.query.user as string)) : null
  });
});

export default router;
