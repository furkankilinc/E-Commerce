const { Router } = require('express');
const {
    merchantRegister,
    merchantLogin,
    merchantRefresh,
    merchantGetMe,
    merchantLogout
} = require('./merchant.auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

// POST /api/auth/merchant/register
router.post('/register', merchantRegister);

// POST /api/auth/merchant/login
router.post('/login', merchantLogin);

// POST /api/auth/merchant/refresh
router.post('/refresh', merchantRefresh);

// POST /api/auth/merchant/logout
router.post('/logout', merchantLogout);

// GET /api/auth/merchant/me
router.get('/me', authenticate('merchant'), merchantGetMe);

module.exports = router;
