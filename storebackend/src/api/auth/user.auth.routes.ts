import { Router } from 'express';
import { userRegister, userLogin, userRefresh, userLogout } from '../auth/user.auth.controller';

const router = Router();

// POST /api/auth/user/register
router.post('/register', userRegister);

// POST /api/auth/user/login
router.post('/login', userLogin);

// POST /api/auth/user/refresh
router.post('/refresh', userRefresh);

// POST /api/auth/user/logout
router.post('/logout', userLogout);

export default router;
