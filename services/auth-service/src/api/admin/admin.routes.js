const { Router } = require('express');
const { getAllUsers, getAllMerchants, getMerchantById, updateMerchantStatus } = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/users', authenticate('admin'), getAllUsers);
router.get('/merchants', authenticate('admin'), getAllMerchants);
router.get('/merchants/:id', authenticate('admin'), getMerchantById);
router.patch('/merchants/:id/status', authenticate('admin'), updateMerchantStatus);

module.exports = router;
