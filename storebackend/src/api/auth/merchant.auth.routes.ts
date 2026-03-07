import { Router } from 'express';
import {
    merchantRegister,
    merchantLogin,
    merchantRefresh,
    merchantLogout,
    merchantGetMe,
} from '../auth/merchant.auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/merchant/register
router.post('/register', merchantRegister);

// POST /api/auth/merchant/login
router.post('/login', merchantLogin);

// POST /api/auth/merchant/refresh
router.post('/refresh', merchantRefresh);

// POST /api/auth/merchant/logout
router.post('/logout', merchantLogout);

// GET /api/auth/merchant/me (Profile)
router.get('/me', authenticate('merchant'), merchantGetMe);

export default router;
