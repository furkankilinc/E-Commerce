const { Router } = require('express');
const {
    getDashboardStats,
    getMapData,
    getAnalyticsData
} = require('./stats.admin.controller');
const { authenticate } = require('../../middlewares/auth.middleware');

const router = Router();

// /api/admin/stats
router.get('/dashboard', authenticate('admin'), getDashboardStats);
router.get('/map', authenticate('admin'), getMapData);
router.get('/analytics', authenticate('admin'), getAnalyticsData);

module.exports = router;
