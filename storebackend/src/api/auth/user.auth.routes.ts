import { Router } from 'express';
import { userRegister, userLogin, userRefresh, userLogout, userGetMe } from '../auth/user.auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/user/register
router.post('/register', userRegister);

// POST /api/auth/user/login
router.post('/login', userLogin);

// POST /api/auth/user/refresh
router.post('/refresh', userRefresh);

// POST /api/auth/user/logout
router.post('/logout', userLogout);

// GET /api/auth/user/me (Profile)
router.get('/me', authenticate('user'), userGetMe);

export default router;
