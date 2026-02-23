import { Router } from 'express';
import {
    adminCreate,
    adminLogin,
    adminRefresh,
    adminLogout,
} from '../auth/admin.auth.controller';
import { authenticate, requireSuperAdmin } from '../../middlewares/auth.middleware';

const router = Router();

// POST /api/auth/admin/login
router.post('/login', adminLogin);

// POST /api/auth/admin/refresh
router.post('/refresh', adminRefresh);

// POST /api/auth/admin/logout
router.post('/logout', adminLogout);

// POST /api/auth/admin/create  (sadece SUPER_ADMIN erişebilir)
router.post('/create', authenticate('admin'), requireSuperAdmin, adminCreate);

export default router;
