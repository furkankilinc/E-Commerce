const { Router } = require('express');
const { getMerchantStats } = require('./stats.controller');
const { authMiddleware, authorize } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/', authMiddleware, authorize('merchant', 'admin'), getMerchantStats);

module.exports = router;
