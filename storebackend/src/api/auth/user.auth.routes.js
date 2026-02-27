const { Router } = require('express');
const {
    userRegister,
    userLogin,
    userRefresh,
    userGetMe,
    userLogout
} = require('./user.auth.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

// POST /api/auth/user/register
router.post('/register', userRegister);

// POST /api/auth/user/login
router.post('/login', userLogin);

// POST /api/auth/user/refresh
router.post('/refresh', userRefresh);

// POST /api/auth/user/logout
router.post('/logout', userLogout);

// GET /api/auth/user/me
router.get('/me', authenticate('user'), userGetMe);

module.exports = router;
