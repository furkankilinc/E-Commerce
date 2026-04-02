const { Router } = require('express');
const { 
    userRegister, 
    userLogin, 
    adminLogin, 
    merchantRegister, 
    merchantLogin 
} = require('./user.auth.controller');

const router = Router();

// User Auth
router.post('/user/register', userRegister);
router.post('/user/login', userLogin);

// Merchant Auth
router.post('/merchant/register', merchantRegister);
router.post('/merchant/login', merchantLogin);

// Admin Auth
router.post('/admin/login', adminLogin);

module.exports = router;
