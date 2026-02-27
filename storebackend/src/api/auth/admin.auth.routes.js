const { Router } = require('express');
const {
    adminCreate,
    adminLogin,
    adminRefresh,
    adminGetMe,
    adminLogout
} = require('./admin.auth.controller');
const { authenticate, requireSuperAdmin } = require('../../middlewares/auth.middleware');

const router = Router();

// POST /api/auth/admin/create (Only SuperAdmins can create other admins)
router.post('/create', authenticate('admin'), requireSuperAdmin, adminCreate);

// POST /api/auth/admin/login
router.post('/login', adminLogin);

// POST /api/auth/admin/refresh
router.post('/refresh', adminRefresh);

// POST /api/auth/admin/logout
router.post('/logout', adminLogout);

// GET /api/auth/admin/me
router.get('/me', authenticate('admin'), adminGetMe);

module.exports = router;
