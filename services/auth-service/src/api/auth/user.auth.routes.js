const { Router } = require('express');
const {
    userRegister,
    userLogin,
    adminLogin,
    merchantRegister,
    merchantLogin,
    userRefresh,
    merchantRefresh,
    adminRefresh,
    getPublicMerchants
} = require('./user.auth.controller');

const router = Router();

// User Auth
router.post('/user/register', userRegister);
router.post('/user/login', userLogin);
router.post('/user/refresh', userRefresh);

// Merchant Auth
router.post('/merchant/register', merchantRegister);
router.post('/merchant/login', merchantLogin);
router.post('/merchant/refresh', merchantRefresh);

// Admin Auth
router.post('/admin/login', adminLogin);
router.post('/admin/refresh', adminRefresh);

// Public Merchant Profiles (Storefront list)
router.get('/merchants', getPublicMerchants);

module.exports = router;
