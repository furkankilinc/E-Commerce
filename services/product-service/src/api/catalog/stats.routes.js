const { Router } = require('express');
const { getDashboardStats, getMapData, getAnalytics } = require('./stats.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

router.get('/dashboard', authenticate('admin'), getDashboardStats);
router.get('/map', authenticate('admin'), getMapData);
router.get('/analytics', authenticate('admin'), getAnalytics);

module.exports = router;
