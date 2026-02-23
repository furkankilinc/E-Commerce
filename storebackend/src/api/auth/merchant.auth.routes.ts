import { Router } from 'express';
import {
    merchantRegister,
    merchantLogin,
    merchantRefresh,
    merchantLogout,
} from '../auth/merchant.auth.controller';

const router = Router();

// POST /api/auth/merchant/register
router.post('/register', merchantRegister);

// POST /api/auth/merchant/login
router.post('/login', merchantLogin);

// POST /api/auth/merchant/refresh
router.post('/refresh', merchantRefresh);

// POST /api/auth/merchant/logout
router.post('/logout', merchantLogout);

export default router;
