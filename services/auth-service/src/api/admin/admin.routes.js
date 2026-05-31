const { Router } = require('express');
const { getAllUsers, getAllMerchants, getMerchantById, updateMerchantStatus, getAuthStats, getAuthMapData } = require('./admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/stats', authenticate('admin'), getAuthStats);
router.get('/map-data', authenticate('admin'), getAuthMapData);
router.get('/users', authenticate('admin'), getAllUsers);
router.get('/merchants', authenticate('admin'), getAllMerchants);
router.get('/merchants/:id', authenticate('admin'), getMerchantById);
router.patch('/merchants/:id/status', authenticate('admin'), updateMerchantStatus);

module.exports = router;
