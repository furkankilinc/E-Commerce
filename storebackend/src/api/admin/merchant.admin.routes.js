const { Router } = require('express');
const {
    getAllMerchants,
    getMerchantById,
    updateMerchantStatus
} = require('./merchant.admin.controller');
const { authenticate, requireSuperAdmin } = require('../../middlewares/auth.middleware');

const router = Router();

// /api/admin/merchants
router.get('/', authenticate('admin'), getAllMerchants);
router.get('/:id', authenticate('admin'), getMerchantById);
router.patch('/:id/status', authenticate('admin'), requireSuperAdmin, updateMerchantStatus);

module.exports = router;
