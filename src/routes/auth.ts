import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// GET /api/auth/me
router.get('/me', AuthController.me);

// POST /api/auth/logout
router.post('/logout', AuthController.logout);

export default router;
